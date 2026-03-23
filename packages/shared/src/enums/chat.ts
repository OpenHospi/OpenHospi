import { defineEnum } from "./utils/define-enum";

export const MessageType = defineEnum(["ciphertext", "sender_key_distribution", "system"] as const);
export type MessageType = (typeof MessageType.values)[number];

export const DeliveryStatus = defineEnum(["sent", "delivered", "read"] as const);
export type DeliveryStatus = (typeof DeliveryStatus.values)[number];
