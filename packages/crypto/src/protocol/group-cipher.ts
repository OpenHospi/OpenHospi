import { utf8ToBytes, bytesToUtf8 } from "./encoding";
import { senderKeyEncrypt, senderKeyDecrypt, StaleSenderKeyError } from "./sender-key";
import type { SenderKeyState, GroupCiphertextPayload } from "./types";

export { StaleSenderKeyError };

/**
 * Encrypt a plaintext message for a group conversation using the local Sender Key.
 */
export async function groupEncrypt(
  senderKeyState: SenderKeyState,
  plaintext: string,
  conversationId: string,
  senderUserId: string,
): Promise<{ payload: GroupCiphertextPayload; updatedState: SenderKeyState }> {
  return senderKeyEncrypt(senderKeyState, utf8ToBytes(plaintext), conversationId, senderUserId);
}

/**
 * Decrypt a group message using the sender's stored Sender Key.
 */
export async function groupDecrypt(
  senderKeyState: SenderKeyState,
  payload: GroupCiphertextPayload,
  conversationId: string,
  senderUserId: string,
): Promise<{ plaintext: string; updatedState: SenderKeyState }> {
  const result = await senderKeyDecrypt(senderKeyState, payload, conversationId, senderUserId);
  return {
    plaintext: bytesToUtf8(result.plaintext),
    updatedState: result.updatedState,
  };
}
