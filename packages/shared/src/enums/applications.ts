import { defineEnum } from "./utils/define-enum";

export const ApplicationStatus = defineEnum([
  "sent",
  "seen",
  "liked",
  "maybe",
  "rejected",
  "hospi",
  "accepted",
  "not_chosen",
  "withdrawn",
] as const);
export type ApplicationStatus = (typeof ApplicationStatus.values)[number];

export const ReviewDecision = defineEnum(["like", "maybe", "reject"] as const);
export type ReviewDecision = (typeof ReviewDecision.values)[number];

export const InvitationStatus = defineEnum([
  "pending",
  "attending",
  "not_attending",
  "maybe",
] as const);
export type InvitationStatus = (typeof InvitationStatus.values)[number];

export const HouseMemberRole = defineEnum(["owner", "member"] as const);
export type HouseMemberRole = (typeof HouseMemberRole.values)[number];
