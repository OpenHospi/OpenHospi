import { ratchetEncrypt, ratchetDecrypt } from "./double-ratchet";
import type {
  SessionState,
  WhisperMessage,
  PreKeyWhisperMessage,
  MessageEnvelope,
  SkippedKey,
} from "./types";

export interface SessionEncryptResult {
  envelope: MessageEnvelope;
  updatedSession: SessionState;
}

export interface SessionDecryptResult {
  plaintext: Uint8Array;
  updatedSession: SessionState;
  updatedSkippedKeys: SkippedKey[];
}

/**
 * Encrypt plaintext using a Double Ratchet session.
 *
 * If `preKeyInfo` is provided, wraps the message in a PreKeyWhisperMessage
 * (used for the first message in a session). Otherwise produces a WhisperMessage.
 */
export async function sessionEncrypt(
  session: SessionState,
  plaintext: Uint8Array,
  preKeyInfo?: {
    identityKey: Uint8Array;
    ephemeralKey: Uint8Array;
    signedPreKeyId: number;
    oneTimePreKeyId?: number;
    registrationId: number;
  },
): Promise<SessionEncryptResult> {
  const { message, updatedSession } = await ratchetEncrypt(session, plaintext);

  if (preKeyInfo) {
    const preKeyMessage: PreKeyWhisperMessage = {
      identityKey: preKeyInfo.identityKey,
      ephemeralKey: preKeyInfo.ephemeralKey,
      signedPreKeyId: preKeyInfo.signedPreKeyId,
      oneTimePreKeyId: preKeyInfo.oneTimePreKeyId,
      registrationId: preKeyInfo.registrationId,
      message,
    };
    return {
      envelope: { type: "prekey", data: preKeyMessage },
      updatedSession,
    };
  }

  return {
    envelope: { type: "whisper", data: message },
    updatedSession,
  };
}

/**
 * Decrypt a WhisperMessage using a Double Ratchet session.
 */
export async function sessionDecrypt(
  session: SessionState,
  message: WhisperMessage,
  skippedKeys: SkippedKey[] = [],
): Promise<SessionDecryptResult> {
  return ratchetDecrypt(session, message, skippedKeys);
}
