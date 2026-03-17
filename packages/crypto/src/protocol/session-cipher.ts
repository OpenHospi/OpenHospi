import { ratchetDecrypt, ratchetEncrypt } from "./double-ratchet";
import { concat, readUint32BE, uint32BE } from "./encoding";
import type { PreKeyWhisperMessage, SessionRecord, WhisperMessage } from "./types";

const WHISPER_MESSAGE_VERSION = 3;

/**
 * Encrypt a plaintext message using an established Double Ratchet session.
 * Returns the updated session and the serialised whisper message.
 */
export function sessionEncrypt(
  session: SessionRecord,
  plaintext: Uint8Array,
): { session: SessionRecord; serialised: Uint8Array; isPreKey: false } {
  const { state, message } = ratchetEncrypt(session.state, plaintext);

  const serialised = serializeWhisperMessage(message);

  return {
    session: { ...session, state },
    serialised,
    isPreKey: false,
  };
}

/**
 * Create a PreKeyWhisperMessage wrapping a WhisperMessage for first contact.
 */
export function createPreKeyMessage(
  registrationId: number,
  signedPreKeyId: number,
  baseKey: Uint8Array,
  identityKey: Uint8Array,
  whisperMessage: Uint8Array,
  preKeyId?: number,
): Uint8Array {
  return serializePreKeyWhisperMessage({
    registrationId,
    preKeyId,
    signedPreKeyId,
    baseKey,
    identityKey,
    message: whisperMessage,
  });
}

/**
 * Decrypt a received whisper message using an established session.
 */
export function sessionDecrypt(
  session: SessionRecord,
  serialised: Uint8Array,
): { session: SessionRecord; plaintext: Uint8Array } {
  const message = deserializeWhisperMessage(serialised);
  const { state, plaintext } = ratchetDecrypt(session.state, message);

  return {
    session: { ...session, state },
    plaintext,
  };
}

// ── Serialisation helpers ────────────────────────────────────────────

function serializeWhisperMessage(msg: WhisperMessage): Uint8Array {
  // Format: version(1) + ratchetKey(32) + counter(4) + previousCounter(4) + ciphertext(N)
  return concat(
    new Uint8Array([WHISPER_MESSAGE_VERSION]),
    msg.ratchetKey,
    uint32BE(msg.counter),
    uint32BE(msg.previousCounter),
    msg.ciphertext,
  );
}

export function deserializeWhisperMessage(data: Uint8Array): WhisperMessage {
  const version = data[0];
  if (version !== WHISPER_MESSAGE_VERSION) {
    throw new Error(`Unsupported whisper message version: ${version}`);
  }
  return {
    ratchetKey: data.slice(1, 33),
    counter: readUint32BE(data, 33),
    previousCounter: readUint32BE(data, 37),
    ciphertext: data.slice(41),
  };
}

function serializePreKeyWhisperMessage(msg: PreKeyWhisperMessage): Uint8Array {
  // Format: type(1) + registrationId(4) + preKeyId(4, -1 if none) + signedPreKeyId(4) + baseKey(32) + identityKey(32) + message(N)
  const preKeyIdValue = msg.preKeyId ?? 0xffffffff;
  return concat(
    new Uint8Array([WHISPER_MESSAGE_VERSION | 0x80]), // high bit = pre-key message
    uint32BE(msg.registrationId),
    uint32BE(preKeyIdValue),
    uint32BE(msg.signedPreKeyId),
    msg.baseKey,
    msg.identityKey,
    msg.message,
  );
}

export function deserializePreKeyWhisperMessage(data: Uint8Array): PreKeyWhisperMessage {
  const type = data[0];
  if ((type & 0x80) === 0) {
    throw new Error("Not a PreKeyWhisperMessage");
  }
  const registrationId = readUint32BE(data, 1);
  const preKeyIdValue = readUint32BE(data, 5);
  const signedPreKeyId = readUint32BE(data, 9);
  const baseKey = data.slice(13, 45);
  const identityKey = data.slice(45, 77);
  const message = data.slice(77);

  return {
    registrationId,
    preKeyId: preKeyIdValue === 0xffffffff ? undefined : preKeyIdValue,
    signedPreKeyId,
    baseKey,
    identityKey,
    message,
  };
}

/** Check if a serialised message is a PreKeyWhisperMessage. */
export function isPreKeyWhisperMessage(data: Uint8Array): boolean {
  return data.length > 0 && (data[0] & 0x80) !== 0;
}
