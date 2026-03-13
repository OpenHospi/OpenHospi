import { getCryptoProvider } from "../primitives/CryptoProvider";

import { concatBytes, utf8ToBytes } from "./encoding";
import type { SessionState, WhisperMessage, SkippedKey } from "./types";

const CHAIN_KEY_SEED = new Uint8Array([0x02]);
const MESSAGE_KEY_SEED = new Uint8Array([0x01]);
const RATCHET_INFO = utf8ToBytes("WhisperRatchet");

const MAX_SKIP = 2000;

// ── Chain Ratchet (Symmetric) ──

async function advanceChainKey(chainKey: Uint8Array): Promise<Uint8Array> {
  const crypto = getCryptoProvider();
  return crypto.hmacSha256(chainKey, CHAIN_KEY_SEED);
}

async function deriveMessageKey(chainKey: Uint8Array): Promise<Uint8Array> {
  const crypto = getCryptoProvider();
  return crypto.hmacSha256(chainKey, MESSAGE_KEY_SEED);
}

// ── DH Ratchet (Asymmetric) ──

async function performDHRatchet(
  rootKey: Uint8Array,
  localPrivateKey: Uint8Array,
  remotePublicKey: Uint8Array,
): Promise<{ newRootKey: Uint8Array; newChainKey: Uint8Array }> {
  const crypto = getCryptoProvider();
  const dhOutput = crypto.x25519SharedSecret(localPrivateKey, remotePublicKey);
  const derived = await crypto.hkdf(dhOutput, rootKey, RATCHET_INFO, 64);
  return {
    newRootKey: derived.slice(0, 32),
    newChainKey: derived.slice(32, 64),
  };
}

// ── Message Encryption / Decryption ──

async function encryptMessage(
  messageKey: Uint8Array,
  plaintext: Uint8Array,
): Promise<{ ciphertext: Uint8Array; iv: Uint8Array }> {
  const crypto = getCryptoProvider();
  // Derive enc key + IV from message key via HKDF
  const derived = await crypto.hkdf(
    messageKey,
    new Uint8Array(32),
    utf8ToBytes("WhisperMessageKeys"),
    80, // 32 enc + 32 mac + 16 iv
  );
  const encKey = derived.slice(0, 32);
  const iv = derived.slice(64, 80);
  const ciphertext = await crypto.aesCbcEncrypt(encKey, plaintext, iv);
  return { ciphertext, iv };
}

async function decryptMessage(messageKey: Uint8Array, ciphertext: Uint8Array): Promise<Uint8Array> {
  const crypto = getCryptoProvider();
  const derived = await crypto.hkdf(
    messageKey,
    new Uint8Array(32),
    utf8ToBytes("WhisperMessageKeys"),
    80,
  );
  const encKey = derived.slice(0, 32);
  const iv = derived.slice(64, 80);
  return crypto.aesCbcDecrypt(encKey, ciphertext, iv);
}

async function computeMAC(messageKey: Uint8Array, data: Uint8Array): Promise<Uint8Array> {
  const crypto = getCryptoProvider();
  const derived = await crypto.hkdf(
    messageKey,
    new Uint8Array(32),
    utf8ToBytes("WhisperMessageKeys"),
    80,
  );
  const macKey = derived.slice(32, 64);
  const mac = await crypto.hmacSha256(macKey, data);
  return mac.slice(0, 8); // Signal uses 8-byte truncated MAC
}

// ── Ratchet Encrypt ──

export async function ratchetEncrypt(
  session: SessionState,
  plaintext: Uint8Array,
): Promise<{ message: WhisperMessage; updatedSession: SessionState }> {
  // Derive message key from current sending chain
  const messageKey = await deriveMessageKey(session.sendingChain.chainKey);
  const nextChainKey = await advanceChainKey(session.sendingChain.chainKey);

  const { ciphertext } = await encryptMessage(messageKey, plaintext);

  const message: WhisperMessage = {
    ratchetPublicKey: session.localRatchetKeyPair.publicKey,
    counter: session.sendingChain.messageCounter,
    previousCounter: session.previousSendingChainLength,
    ciphertext,
    mac: new Uint8Array(8), // placeholder, computed below
  };

  // Compute MAC over the serialized message content
  const macData = concatBytes(
    message.ratchetPublicKey,
    new Uint8Array([
      (message.counter >> 24) & 0xff,
      (message.counter >> 16) & 0xff,
      (message.counter >> 8) & 0xff,
      message.counter & 0xff,
    ]),
    message.ciphertext,
  );
  message.mac = await computeMAC(messageKey, macData);

  const updatedSession: SessionState = {
    ...session,
    sendingChain: {
      chainKey: nextChainKey,
      messageCounter: session.sendingChain.messageCounter + 1,
    },
  };

  return { message, updatedSession };
}

// ── Ratchet Decrypt ──

export async function ratchetDecrypt(
  session: SessionState,
  message: WhisperMessage,
  skippedKeys: SkippedKey[],
): Promise<{
  plaintext: Uint8Array;
  updatedSession: SessionState;
  updatedSkippedKeys: SkippedKey[];
}> {
  const crypto = getCryptoProvider();

  // Check skipped keys first
  for (let i = 0; i < skippedKeys.length; i++) {
    const sk = skippedKeys[i]!;
    if (
      bytesEqualFast(sk.ratchetPublicKey, message.ratchetPublicKey) &&
      sk.messageIndex === message.counter
    ) {
      const plaintext = await decryptMessage(sk.messageKey, message.ciphertext);
      const updatedSkippedKeys = [...skippedKeys.slice(0, i), ...skippedKeys.slice(i + 1)];
      return { plaintext, updatedSession: session, updatedSkippedKeys };
    }
  }

  let currentSession = session;
  let currentSkippedKeys = [...skippedKeys];

  // If new ratchet key, perform DH ratchet step
  if (!bytesEqualFast(message.ratchetPublicKey, currentSession.remoteRatchetPublicKey)) {
    // Skip remaining messages in current receiving chain
    if (currentSession.receivingChain) {
      const skipResult = await skipMessageKeys(
        currentSession,
        currentSkippedKeys,
        message.previousCounter,
        currentSession.remoteRatchetPublicKey,
      );
      currentSession = skipResult.session;
      currentSkippedKeys = skipResult.skippedKeys;
    }

    // DH ratchet step: receiving
    const { newRootKey: rootKey1, newChainKey: recvChainKey } = await performDHRatchet(
      currentSession.rootKey,
      currentSession.localRatchetKeyPair.privateKey,
      message.ratchetPublicKey,
    );

    // Generate new ratchet key pair
    const newRatchetKeyPair = crypto.x25519GenerateKeyPair();

    // DH ratchet step: sending
    const { newRootKey: rootKey2, newChainKey: sendChainKey } = await performDHRatchet(
      rootKey1,
      newRatchetKeyPair.privateKey,
      message.ratchetPublicKey,
    );

    currentSession = {
      ...currentSession,
      rootKey: rootKey2,
      sendingChain: { chainKey: sendChainKey, messageCounter: 0 },
      receivingChain: { chainKey: recvChainKey, messageCounter: 0 },
      previousSendingChainLength: currentSession.sendingChain.messageCounter,
      localRatchetKeyPair: newRatchetKeyPair,
      remoteRatchetPublicKey: message.ratchetPublicKey,
    };
  }

  // Skip messages in current receiving chain if needed
  if (currentSession.receivingChain!.messageCounter < message.counter) {
    const skipResult = await skipMessageKeys(
      currentSession,
      currentSkippedKeys,
      message.counter,
      message.ratchetPublicKey,
    );
    currentSession = skipResult.session;
    currentSkippedKeys = skipResult.skippedKeys;
  }

  // Derive message key and decrypt
  const messageKey = await deriveMessageKey(currentSession.receivingChain!.chainKey);
  const nextChainKey = await advanceChainKey(currentSession.receivingChain!.chainKey);

  // Verify MAC
  const macData = concatBytes(
    message.ratchetPublicKey,
    new Uint8Array([
      (message.counter >> 24) & 0xff,
      (message.counter >> 16) & 0xff,
      (message.counter >> 8) & 0xff,
      message.counter & 0xff,
    ]),
    message.ciphertext,
  );
  const expectedMAC = await computeMAC(messageKey, macData);
  if (!bytesEqualConstantTime(message.mac, expectedMAC)) {
    throw new Error("MAC verification failed");
  }

  const plaintext = await decryptMessage(messageKey, message.ciphertext);

  const updatedSession: SessionState = {
    ...currentSession,
    receivingChain: {
      chainKey: nextChainKey,
      messageCounter: currentSession.receivingChain!.messageCounter + 1,
    },
  };

  return { plaintext, updatedSession, updatedSkippedKeys: currentSkippedKeys };
}

// ── Helper: Skip message keys ──

async function skipMessageKeys(
  session: SessionState,
  skippedKeys: SkippedKey[],
  targetCounter: number,
  ratchetPublicKey: Uint8Array,
): Promise<{ session: SessionState; skippedKeys: SkippedKey[] }> {
  if (!session.receivingChain) return { session, skippedKeys };

  const toSkip = targetCounter - session.receivingChain.messageCounter;
  if (toSkip > MAX_SKIP) {
    throw new Error(`Too many skipped messages (${toSkip}), maximum is ${MAX_SKIP}`);
  }

  let { chainKey, messageCounter } = session.receivingChain;
  const newSkippedKeys = [...skippedKeys];

  for (let i = 0; i < toSkip; i++) {
    const messageKey = await deriveMessageKey(chainKey);
    newSkippedKeys.push({
      ratchetPublicKey: new Uint8Array(ratchetPublicKey),
      messageIndex: messageCounter,
      messageKey,
    });
    chainKey = await advanceChainKey(chainKey);
    messageCounter++;
  }

  return {
    session: {
      ...session,
      receivingChain: { chainKey, messageCounter },
    },
    skippedKeys: newSkippedKeys,
  };
}

// ── Utility ──

function bytesEqualFast(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}

function bytesEqualConstantTime(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a[i]! ^ b[i]!;
  }
  return diff === 0;
}
