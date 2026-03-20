import { defineEnum } from "./utils/define-enum";

export const DevicePlatform = defineEnum(["web", "ios", "android"] as const);
export type DevicePlatform = (typeof DevicePlatform.values)[number];

export const SenderKeyDistributionStatus = defineEnum(["pending", "delivered"] as const);
export type SenderKeyDistributionStatus = (typeof SenderKeyDistributionStatus.values)[number];
