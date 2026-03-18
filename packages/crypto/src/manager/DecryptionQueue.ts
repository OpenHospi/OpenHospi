import type { ProtocolAddress, SenderKeyMessageData } from "../protocol/types";

export interface QueuedMessage {
  id: string;
  conversationId: string;
  senderAddress: ProtocolAddress;
  payload: SenderKeyMessageData;
  attempts: number;
  firstAttempt: number;
  lastAttempt: number;
}

const MAX_ATTEMPTS = 5;
const MAX_AGE_MS = 60 * 60 * 1000; // 1 hour

/**
 * Queue for messages that failed to decrypt (usually because the sender key
 * distribution hasn't arrived yet). Messages are retried after processing
 * new distributions.
 */
export class DecryptionQueue {
  private queue: Map<string, QueuedMessage> = new Map();

  enqueue(
    messageId: string,
    conversationId: string,
    senderAddress: ProtocolAddress,
    payload: SenderKeyMessageData,
  ): void {
    const existing = this.queue.get(messageId);

    if (existing) {
      existing.attempts++;
      existing.lastAttempt = Date.now();
      return;
    }

    this.queue.set(messageId, {
      id: messageId,
      conversationId,
      senderAddress,
      payload,
      attempts: 1,
      firstAttempt: Date.now(),
      lastAttempt: Date.now(),
    });
  }

  dequeue(messageId: string): void {
    this.queue.delete(messageId);
  }

  /**
   * Get all queued messages for a conversation from a specific sender.
   * Used after receiving a sender key distribution to retry decryption.
   */
  getForSender(conversationId: string, senderAddress: ProtocolAddress): QueuedMessage[] {
    const results: QueuedMessage[] = [];
    const senderKey = `${senderAddress.userId}:${senderAddress.deviceId}`;

    for (const msg of this.queue.values()) {
      const msgSenderKey = `${msg.senderAddress.userId}:${msg.senderAddress.deviceId}`;
      if (msg.conversationId === conversationId && msgSenderKey === senderKey) {
        results.push(msg);
      }
    }

    return results.sort((a, b) => a.firstAttempt - b.firstAttempt);
  }

  /**
   * Remove expired and max-attempt messages from the queue.
   */
  cleanup(): string[] {
    const now = Date.now();
    const removed: string[] = [];

    for (const [id, msg] of this.queue) {
      if (msg.attempts >= MAX_ATTEMPTS || now - msg.firstAttempt > MAX_AGE_MS) {
        this.queue.delete(id);
        removed.push(id);
      }
    }

    return removed;
  }

  get size(): number {
    return this.queue.size;
  }

  getAll(): QueuedMessage[] {
    return Array.from(this.queue.values());
  }
}
