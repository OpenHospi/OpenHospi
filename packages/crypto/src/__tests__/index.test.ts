import { beforeAll, describe, expect, it } from "vitest";

import { createWebBackend } from "../backends/web";
import {
  // Platform
  setBackend,
  getBackend,

  // Encoding
  toBase64,
  fromBase64,
  concatBytes,
  bytesEqual,

  // Keys
  generateIdentityKeyPair,
  generateSignedPreKey,
  generateOneTimePreKeys,
  verifySignedPreKey,

  // X3DH
  x3dhInitiate,
  x3dhRespond,

  // Sender Key Chain
  senderKeyChainStep,
  fastForwardChain,

  // Sender Key
  generateSenderKey,
  senderKeyEncrypt,
  senderKeyDecrypt,
  serializeSenderKeyState,
  deserializeSenderKeyState,

  // Encryption
  encrypt,
  decrypt,
  encodeGroupAad,
  encodeSignatureData,

  // Safety Numbers
  generateSafetyNumber,

  // Backup
  deriveKeyFromPIN,
  encryptIdentityBackup,
  decryptIdentityBackup,
} from "../index";
import type { PreKeyBundle, SenderKeyState } from "../protocol/types";

// ── Setup ──

beforeAll(() => {
  setBackend(createWebBackend());
});

// ── Encoding ──

describe("encoding helpers", () => {
  it("toBase64/fromBase64 roundtrip", () => {
    const original = new Uint8Array([1, 2, 3, 4, 5]);
    const encoded = toBase64(original);
    const decoded = fromBase64(encoded);
    expect(decoded).toEqual(original);
  });

  it("handles empty buffer", () => {
    const empty = new Uint8Array(0);
    expect(toBase64(empty)).toBe("");
    expect(fromBase64("")).toEqual(new Uint8Array(0));
  });

  it("handles large buffer (1KB)", () => {
    const large = new Uint8Array(1024);
    for (let i = 0; i < 1024; i++) large[i] = i % 256;
    const decoded = fromBase64(toBase64(large));
    expect(decoded).toEqual(large);
  });

  it("concatBytes joins arrays", () => {
    const result = concatBytes(new Uint8Array([1, 2]), new Uint8Array([3, 4, 5]));
    expect(result).toEqual(new Uint8Array([1, 2, 3, 4, 5]));
  });

  it("bytesEqual works correctly", () => {
    expect(bytesEqual(new Uint8Array([1, 2, 3]), new Uint8Array([1, 2, 3]))).toBe(true);
    expect(bytesEqual(new Uint8Array([1, 2, 3]), new Uint8Array([1, 2, 4]))).toBe(false);
    expect(bytesEqual(new Uint8Array([1, 2, 3]), new Uint8Array([1, 2]))).toBe(false);
  });
});

// ── Key Generation ──

describe("key generation", () => {
  it("generates Ed25519 identity key pair with X25519 DH keys", () => {
    const backend = getBackend();
    const identity = generateIdentityKeyPair(backend);

    expect(identity.signing.publicKey).toHaveLength(32);
    expect(identity.signing.privateKey).toHaveLength(32);
    expect(identity.dh.publicKey).toHaveLength(32);
    expect(identity.dh.privateKey).toHaveLength(32);
  });

  it("generates unique key pairs each time", () => {
    const backend = getBackend();
    const kp1 = generateIdentityKeyPair(backend);
    const kp2 = generateIdentityKeyPair(backend);
    expect(bytesEqual(kp1.signing.publicKey, kp2.signing.publicKey)).toBe(false);
  });

  it("generates signed pre-key with valid Ed25519 signature", () => {
    const backend = getBackend();
    const identity = generateIdentityKeyPair(backend);
    const spk = generateSignedPreKey(backend, identity.signing.privateKey, 1);

    expect(spk.keyId).toBe(1);
    expect(spk.keyPair.publicKey).toHaveLength(32);
    expect(spk.signature.length).toBeGreaterThan(0);

    const isValid = verifySignedPreKey(
      backend,
      identity.signing.publicKey,
      spk.keyPair.publicKey,
      spk.signature,
    );
    expect(isValid).toBe(true);
  });

  it("rejects tampered signed pre-key signature", () => {
    const backend = getBackend();
    const identity = generateIdentityKeyPair(backend);
    const spk = generateSignedPreKey(backend, identity.signing.privateKey, 1);

    const tamperedSig = new Uint8Array(spk.signature);
    tamperedSig[0] ^= 0xff;

    expect(
      verifySignedPreKey(backend, identity.signing.publicKey, spk.keyPair.publicKey, tamperedSig),
    ).toBe(false);
  });

  it("generates batch of one-time pre-keys", () => {
    const backend = getBackend();
    const opks = generateOneTimePreKeys(backend, 100, 5);

    expect(opks).toHaveLength(5);
    expect(opks[0].keyId).toBe(100);
    expect(opks[4].keyId).toBe(104);

    const pubs = opks.map((k) => toBase64(k.keyPair.publicKey));
    expect(new Set(pubs).size).toBe(5);
  });
});

// ── X3DH Key Exchange ──

describe("X3DH key exchange", () => {
  it("establishes shared secret between initiator and responder (with OPK)", async () => {
    const backend = getBackend();
    const alice = generateIdentityKeyPair(backend);
    const bob = generateIdentityKeyPair(backend);
    const spk = generateSignedPreKey(backend, bob.signing.privateKey, 1);
    const [opk] = generateOneTimePreKeys(backend, 1, 1);

    const bundle: PreKeyBundle = {
      identityKey: bob.dh.publicKey,
      signingKey: bob.signing.publicKey,
      signedPreKeyPublic: spk.keyPair.publicKey,
      signedPreKeyId: spk.keyId,
      signedPreKeySignature: spk.signature,
      oneTimePreKeyPublic: opk.keyPair.publicKey,
      oneTimePreKeyId: opk.keyId,
    };

    const aliceResult = await x3dhInitiate(backend, alice, bundle);

    const bobResult = await x3dhRespond(
      backend,
      bob,
      spk.keyPair.privateKey,
      opk.keyPair.privateKey,
      alice.dh.publicKey,
      aliceResult.ephemeralPublicKey,
    );

    expect(bytesEqual(aliceResult.sharedSecret, bobResult)).toBe(true);
  });

  it("establishes shared secret without OPK (3 DH values)", async () => {
    const backend = getBackend();
    const alice = generateIdentityKeyPair(backend);
    const bob = generateIdentityKeyPair(backend);
    const spk = generateSignedPreKey(backend, bob.signing.privateKey, 1);

    const bundle: PreKeyBundle = {
      identityKey: bob.dh.publicKey,
      signingKey: bob.signing.publicKey,
      signedPreKeyPublic: spk.keyPair.publicKey,
      signedPreKeyId: spk.keyId,
      signedPreKeySignature: spk.signature,
    };

    const aliceResult = await x3dhInitiate(backend, alice, bundle);

    const bobResult = await x3dhRespond(
      backend,
      bob,
      spk.keyPair.privateKey,
      null,
      alice.dh.publicKey,
      aliceResult.ephemeralPublicKey,
    );

    expect(bytesEqual(aliceResult.sharedSecret, bobResult)).toBe(true);
  });

  it("rejects bundle with invalid signed pre-key signature", async () => {
    const backend = getBackend();
    const alice = generateIdentityKeyPair(backend);
    const bob = generateIdentityKeyPair(backend);
    const spk = generateSignedPreKey(backend, bob.signing.privateKey, 1);

    const badSig = new Uint8Array(spk.signature);
    badSig[0] ^= 0xff;

    const bundle: PreKeyBundle = {
      identityKey: bob.dh.publicKey,
      signingKey: bob.signing.publicKey,
      signedPreKeyPublic: spk.keyPair.publicKey,
      signedPreKeyId: spk.keyId,
      signedPreKeySignature: badSig,
    };

    await expect(x3dhInitiate(backend, alice, bundle)).rejects.toThrow();
  });
});

// ── AES-256-GCM Encryption ──

describe("AES-256-GCM encryption", () => {
  it("encrypt → decrypt roundtrip", async () => {
    const backend = getBackend();
    const key = backend.randomBytes(32);
    const plaintext = new TextEncoder().encode("Hello, E2EE!");

    const { ciphertext, iv } = await encrypt(backend, key, plaintext);
    const decrypted = await decrypt(backend, key, ciphertext, iv);
    expect(new TextDecoder().decode(decrypted)).toBe("Hello, E2EE!");
  });

  it("encrypt with AAD → decrypt requires same AAD", async () => {
    const backend = getBackend();
    const key = backend.randomBytes(32);
    const plaintext = new TextEncoder().encode("AAD test");
    const aad = new TextEncoder().encode("header-data");

    const { ciphertext, iv } = await encrypt(backend, key, plaintext, aad);

    const decrypted = await decrypt(backend, key, ciphertext, iv, aad);
    expect(new TextDecoder().decode(decrypted)).toBe("AAD test");

    const wrongAad = new TextEncoder().encode("wrong-header");
    await expect(decrypt(backend, key, ciphertext, iv, wrongAad)).rejects.toThrow();
  });

  it("tampered ciphertext throws", async () => {
    const backend = getBackend();
    const key = backend.randomBytes(32);
    const { ciphertext, iv } = await encrypt(backend, key, new TextEncoder().encode("tamper test"));

    const tampered = new Uint8Array(ciphertext);
    tampered[0] ^= 0xff;
    await expect(decrypt(backend, key, tampered, iv)).rejects.toThrow();
  });

  it("encodeGroupAad produces consistent output", () => {
    const aad1 = encodeGroupAad("conv-1", "user-1", 5);
    const aad2 = encodeGroupAad("conv-1", "user-1", 5);
    expect(bytesEqual(aad1, aad2)).toBe(true);
  });

  it("encodeSignatureData produces consistent output", () => {
    const sig1 = encodeSignatureData("ct", "iv", 3);
    const sig2 = encodeSignatureData("ct", "iv", 3);
    expect(bytesEqual(sig1, sig2)).toBe(true);
  });

  it("different messages produce different IVs", async () => {
    const backend = getBackend();
    const key = backend.randomBytes(32);
    const plaintext = new TextEncoder().encode("same");

    const r1 = await encrypt(backend, key, plaintext);
    const r2 = await encrypt(backend, key, plaintext);
    expect(bytesEqual(r1.iv, r2.iv)).toBe(false);
  });

  it("unicode roundtrips correctly", async () => {
    const backend = getBackend();
    const key = backend.randomBytes(32);
    const text = "Héllo wörld €100";

    const { ciphertext, iv } = await encrypt(backend, key, new TextEncoder().encode(text));
    const decrypted = await decrypt(backend, key, ciphertext, iv);
    expect(new TextDecoder().decode(decrypted)).toBe(text);
  });
});

// ── Sender Key Chain ──

describe("Sender Key chain", () => {
  it("senderKeyChainStep produces distinct chain key and message key", async () => {
    const backend = getBackend();
    const chainKey = backend.randomBytes(32);

    const result = await senderKeyChainStep(backend, chainKey);

    expect(result.nextChainKey).toHaveLength(32);
    expect(result.messageKey).toHaveLength(32);
    expect(bytesEqual(result.nextChainKey, result.messageKey)).toBe(false);
    expect(bytesEqual(result.nextChainKey, chainKey)).toBe(false);
  });

  it("senderKeyChainStep is deterministic", async () => {
    const backend = getBackend();
    const chainKey = backend.randomBytes(32);

    const r1 = await senderKeyChainStep(backend, chainKey);
    const r2 = await senderKeyChainStep(backend, chainKey);

    expect(bytesEqual(r1.nextChainKey, r2.nextChainKey)).toBe(true);
    expect(bytesEqual(r1.messageKey, r2.messageKey)).toBe(true);
  });

  it("fastForwardChain advances to target iteration", async () => {
    const backend = getBackend();
    const chainKey = backend.randomBytes(32);

    const result = await fastForwardChain(backend, chainKey, 0, 5);

    expect(result.messageKey).toHaveLength(32);
    expect(result.chainKey).toHaveLength(32);
    expect(result.skippedKeys.size).toBe(5); // iterations 0-4 are skipped
  });

  it("fastForwardChain with 0 gap returns message key directly", async () => {
    const backend = getBackend();
    const chainKey = backend.randomBytes(32);

    const result = await fastForwardChain(backend, chainKey, 0, 0);

    expect(result.messageKey).toHaveLength(32);
    expect(result.skippedKeys.size).toBe(0);
  });

  it("fastForwardChain throws for excessive gap", async () => {
    const backend = getBackend();
    const chainKey = backend.randomBytes(32);

    await expect(fastForwardChain(backend, chainKey, 0, 2001)).rejects.toThrow();
  });

  it("sequential steps match fast-forward", async () => {
    const backend = getBackend();
    const chainKey = backend.randomBytes(32);

    // Step manually 3 times
    const s1 = await senderKeyChainStep(backend, chainKey);
    const s2 = await senderKeyChainStep(backend, s1.nextChainKey);
    const s3 = await senderKeyChainStep(backend, s2.nextChainKey);

    // Fast-forward from 0 to 2 (skips 0, 1; returns key for 2)
    const ff = await fastForwardChain(backend, chainKey, 0, 2);

    expect(bytesEqual(s3.messageKey, ff.messageKey)).toBe(true);
    expect(bytesEqual(s3.nextChainKey, ff.chainKey)).toBe(true);
  });
});

// ── Sender Key Encrypt/Decrypt ──

describe("Sender Key encrypt/decrypt", () => {
  it("basic encrypt → decrypt roundtrip", async () => {
    const backend = getBackend();
    const state = generateSenderKey(backend);
    const conversationId = "conv-1";
    const userId = "user-1";

    const { state: afterEncrypt, payload } = await senderKeyEncrypt(
      backend,
      state,
      "Hello Sender Keys!",
      conversationId,
      userId,
    );

    // Decrypt using the original state (before encryption advanced chain)
    const { plaintext } = await senderKeyDecrypt(
      backend,
      state,
      payload,
      state.signingKeyPair.publicKey,
      conversationId,
      userId,
    );

    expect(plaintext).toBe("Hello Sender Keys!");
    expect(afterEncrypt.iteration).toBe(state.iteration + 1);
  });

  it("multiple messages in sequence", async () => {
    const backend = getBackend();
    let senderState = generateSenderKey(backend);
    let receiverState: SenderKeyState = { ...senderState };
    const signingPub = senderState.signingKeyPair.publicKey;
    const convId = "conv-1";
    const userId = "user-1";

    for (let i = 0; i < 5; i++) {
      const { state: newSenderState, payload } = await senderKeyEncrypt(
        backend,
        senderState,
        `message ${i}`,
        convId,
        userId,
      );
      senderState = newSenderState;

      const { state: newReceiverState, plaintext } = await senderKeyDecrypt(
        backend,
        receiverState,
        payload,
        signingPub,
        convId,
        userId,
      );
      receiverState = newReceiverState;

      expect(plaintext).toBe(`message ${i}`);
    }

    expect(senderState.iteration).toBe(5);
  });

  it("out-of-order message delivery", async () => {
    const backend = getBackend();
    const senderState = generateSenderKey(backend);
    const receiverState: SenderKeyState = { ...senderState };
    const signingPub = senderState.signingKeyPair.publicKey;
    const convId = "conv-1";
    const userId = "user-1";

    // Encrypt 3 messages
    const { state: s1, payload: p1 } = await senderKeyEncrypt(
      backend,
      senderState,
      "first",
      convId,
      userId,
    );
    const { state: s2, payload: p2 } = await senderKeyEncrypt(
      backend,
      s1,
      "second",
      convId,
      userId,
    );
    const { payload: p3 } = await senderKeyEncrypt(backend, s2, "third", convId, userId);

    // Decrypt in reverse order
    const { state: r1, plaintext: t3 } = await senderKeyDecrypt(
      backend,
      receiverState,
      p3,
      signingPub,
      convId,
      userId,
    );
    expect(t3).toBe("third");

    // First message — should use skipped keys
    const { state: r2, plaintext: t1 } = await senderKeyDecrypt(
      backend,
      r1,
      p1,
      signingPub,
      convId,
      userId,
    );
    expect(t1).toBe("first");

    // Second message — should use skipped keys
    const { plaintext: t2 } = await senderKeyDecrypt(backend, r2, p2, signingPub, convId, userId);
    expect(t2).toBe("second");
  });

  it("tampered signature → verification fails", async () => {
    const backend = getBackend();
    const state = generateSenderKey(backend);
    const convId = "conv-1";
    const userId = "user-1";

    const { payload } = await senderKeyEncrypt(backend, state, "tamper test", convId, userId);

    // Tamper with signature
    const sigBytes = fromBase64(payload.signature);
    sigBytes[0] ^= 0xff;
    const tampered = { ...payload, signature: toBase64(sigBytes) };

    await expect(
      senderKeyDecrypt(backend, state, tampered, state.signingKeyPair.publicKey, convId, userId),
    ).rejects.toThrow();
  });

  it("wrong conversationId → AAD mismatch → decrypt fails", async () => {
    const backend = getBackend();
    const state = generateSenderKey(backend);
    const userId = "user-1";

    const { payload } = await senderKeyEncrypt(backend, state, "aad test", "conv-1", userId);

    await expect(
      senderKeyDecrypt(
        backend,
        state,
        payload,
        state.signingKeyPair.publicKey,
        "conv-wrong",
        userId,
      ),
    ).rejects.toThrow();
  });

  it("wrong senderUserId → AAD mismatch → decrypt fails", async () => {
    const backend = getBackend();
    const state = generateSenderKey(backend);
    const convId = "conv-1";

    const { payload } = await senderKeyEncrypt(backend, state, "aad test", convId, "user-1");

    await expect(
      senderKeyDecrypt(
        backend,
        state,
        payload,
        state.signingKeyPair.publicKey,
        convId,
        "user-wrong",
      ),
    ).rejects.toThrow();
  });

  it("each message uses a different encryption key (different ciphertext)", async () => {
    const backend = getBackend();
    const state = generateSenderKey(backend);

    const { state: s1, payload: p1 } = await senderKeyEncrypt(
      backend,
      state,
      "same text",
      "conv-1",
      "user-1",
    );
    const { payload: p2 } = await senderKeyEncrypt(backend, s1, "same text", "conv-1", "user-1");

    expect(p1.ciphertext).not.toBe(p2.ciphertext);
    expect(p1.chainIteration).not.toBe(p2.chainIteration);
  });

  it("serialization roundtrip preserves state", async () => {
    const backend = getBackend();
    const state = generateSenderKey(backend);

    const { state: afterEncrypt, payload } = await senderKeyEncrypt(
      backend,
      state,
      "serialize test",
      "conv-1",
      "user-1",
    );

    const serialized = serializeSenderKeyState(afterEncrypt);
    const deserialized = deserializeSenderKeyState(serialized);

    const { payload: p2 } = await senderKeyEncrypt(
      backend,
      deserialized,
      "after deserialize",
      "conv-1",
      "user-1",
    );
    expect(p2.ciphertext).toBeDefined();
    expect(p2.chainIteration).toBe(payload.chainIteration + 1);
  });

  it("empty string roundtrips correctly", async () => {
    const backend = getBackend();
    const state = generateSenderKey(backend);

    const { payload } = await senderKeyEncrypt(backend, state, "", "conv-1", "user-1");
    const { plaintext } = await senderKeyDecrypt(
      backend,
      state,
      payload,
      state.signingKeyPair.publicKey,
      "conv-1",
      "user-1",
    );
    expect(plaintext).toBe("");
  });

  it("large message (50KB) roundtrips correctly", async () => {
    const backend = getBackend();
    const state = generateSenderKey(backend);
    const large = "x".repeat(50_000);

    const { payload } = await senderKeyEncrypt(backend, state, large, "conv-1", "user-1");
    const { plaintext } = await senderKeyDecrypt(
      backend,
      state,
      payload,
      state.signingKeyPair.publicKey,
      "conv-1",
      "user-1",
    );
    expect(plaintext).toBe(large);
  });

  it("unicode roundtrips correctly", async () => {
    const backend = getBackend();
    const state = generateSenderKey(backend);
    const text = "Héllo wörld €100 你好世界";

    const { payload } = await senderKeyEncrypt(backend, state, text, "conv-1", "user-1");
    const { plaintext } = await senderKeyDecrypt(
      backend,
      state,
      payload,
      state.signingKeyPair.publicKey,
      "conv-1",
      "user-1",
    );
    expect(plaintext).toBe(text);
  });
});

// ── Safety Numbers ──

describe("safety numbers", () => {
  it("generates a 60-digit code (12 groups of 5)", async () => {
    const backend = getBackend();
    const alice = generateIdentityKeyPair(backend);
    const bob = generateIdentityKeyPair(backend);

    const code = await generateSafetyNumber(
      "alice-id",
      alice.signing.publicKey,
      "bob-id",
      bob.signing.publicKey,
    );

    const groups = code.split(" ");
    expect(groups).toHaveLength(12);
    for (const group of groups) {
      expect(group).toMatch(/^\d{5}$/);
    }
  });

  it("is symmetric: same code regardless of who computes it", async () => {
    const backend = getBackend();
    const alice = generateIdentityKeyPair(backend);
    const bob = generateIdentityKeyPair(backend);

    const codeAlice = await generateSafetyNumber(
      "alice-id",
      alice.signing.publicKey,
      "bob-id",
      bob.signing.publicKey,
    );
    const codeBob = await generateSafetyNumber(
      "bob-id",
      bob.signing.publicKey,
      "alice-id",
      alice.signing.publicKey,
    );

    expect(codeAlice).toBe(codeBob);
  });

  it("is deterministic: same inputs → same output", async () => {
    const backend = getBackend();
    const alice = generateIdentityKeyPair(backend);
    const bob = generateIdentityKeyPair(backend);

    const code1 = await generateSafetyNumber(
      "alice-id",
      alice.signing.publicKey,
      "bob-id",
      bob.signing.publicKey,
    );
    const code2 = await generateSafetyNumber(
      "alice-id",
      alice.signing.publicKey,
      "bob-id",
      bob.signing.publicKey,
    );

    expect(code1).toBe(code2);
  });

  it("different keys produce different safety numbers", async () => {
    const backend = getBackend();
    const alice = generateIdentityKeyPair(backend);
    const bob = generateIdentityKeyPair(backend);
    const eve = generateIdentityKeyPair(backend);

    const codeAB = await generateSafetyNumber(
      "alice-id",
      alice.signing.publicKey,
      "bob-id",
      bob.signing.publicKey,
    );
    const codeAE = await generateSafetyNumber(
      "alice-id",
      alice.signing.publicKey,
      "eve-id",
      eve.signing.publicKey,
    );

    expect(codeAB).not.toBe(codeAE);
  });
});

// ── Identity Backup ──

describe("identity backup (PIN-encrypted)", () => {
  it("encrypt → decrypt roundtrip", async () => {
    const backend = getBackend();
    const identity = generateIdentityKeyPair(backend);

    const data = {
      signingPrivateKey: toBase64(identity.signing.privateKey),
      signingPublicKey: toBase64(identity.signing.publicKey),
      dhPrivateKey: toBase64(identity.dh.privateKey),
      dhPublicKey: toBase64(identity.dh.publicKey),
    };

    const backup = await encryptIdentityBackup(backend, data, "123456");
    const recovered = await decryptIdentityBackup(backend, backup, "123456");
    expect(recovered).toEqual(data);
  });

  it("wrong PIN → decryption throws", async () => {
    const backend = getBackend();
    const identity = generateIdentityKeyPair(backend);

    const data = {
      signingPrivateKey: toBase64(identity.signing.privateKey),
      signingPublicKey: toBase64(identity.signing.publicKey),
      dhPrivateKey: toBase64(identity.dh.privateKey),
      dhPublicKey: toBase64(identity.dh.publicKey),
    };

    const backup = await encryptIdentityBackup(backend, data, "123456");
    await expect(decryptIdentityBackup(backend, backup, "654321")).rejects.toThrow();
  });

  it("two backups of same data → different ciphertext (random salt/IV)", async () => {
    const backend = getBackend();
    const identity = generateIdentityKeyPair(backend);

    const data = {
      signingPrivateKey: toBase64(identity.signing.privateKey),
      signingPublicKey: toBase64(identity.signing.publicKey),
      dhPrivateKey: toBase64(identity.dh.privateKey),
      dhPublicKey: toBase64(identity.dh.publicKey),
    };

    const backup1 = await encryptIdentityBackup(backend, data, "123456");
    const backup2 = await encryptIdentityBackup(backend, data, "123456");

    expect(backup1.ciphertext).not.toBe(backup2.ciphertext);
    expect(backup1.salt).not.toBe(backup2.salt);
  });

  it("tampered ciphertext → throws", async () => {
    const backend = getBackend();
    const identity = generateIdentityKeyPair(backend);

    const data = {
      signingPrivateKey: toBase64(identity.signing.privateKey),
      signingPublicKey: toBase64(identity.signing.publicKey),
      dhPrivateKey: toBase64(identity.dh.privateKey),
      dhPublicKey: toBase64(identity.dh.publicKey),
    };

    const backup = await encryptIdentityBackup(backend, data, "123456");
    const bytes = fromBase64(backup.ciphertext);
    bytes[0] ^= 0xff;
    const tampered = { ...backup, ciphertext: toBase64(bytes) };

    await expect(decryptIdentityBackup(backend, tampered, "123456")).rejects.toThrow();
  });

  it("deriveKeyFromPIN is deterministic with same salt", async () => {
    const backend = getBackend();
    const salt = backend.randomBytes(32);
    const key1 = await deriveKeyFromPIN(backend, "123456", salt, 1000);
    const key2 = await deriveKeyFromPIN(backend, "123456", salt, 1000);
    expect(bytesEqual(key1, key2)).toBe(true);
  });

  it("deriveKeyFromPIN: different PINs → different keys", async () => {
    const backend = getBackend();
    const salt = backend.randomBytes(32);
    const key1 = await deriveKeyFromPIN(backend, "123456", salt, 1000);
    const key2 = await deriveKeyFromPIN(backend, "654321", salt, 1000);
    expect(bytesEqual(key1, key2)).toBe(false);
  });
});
