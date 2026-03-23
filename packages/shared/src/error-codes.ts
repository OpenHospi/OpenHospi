import { defineEnum } from "./enums/utils/define-enum";

// ─── Cross-domain errors shared by multiple features ────────────────────────

export const CommonError = defineEnum([
  "rate_limited",
  "processing_restricted",
  "invalid_data",
  "not_authenticated",
  "upload_failed",
  "delete_failed",
  "not_found",
  "invalid_transition",
] as const);
export type CommonError = (typeof CommonError.values)[number];

// ─── Room management ────────────────────────────────────────────────────────

export const RoomError = defineEnum([
  "invalid_name",
  "create_failed",
  "no_house",
  "publish_error",
] as const);
export type RoomError = (typeof RoomError.values)[number];

// ─── Applications ───────────────────────────────────────────────────────────

export const ApplicationError = defineEnum([
  "bio_required",
  "room_not_active",
  "is_housemate",
  "already_applied",
  "cannot_withdraw",
] as const);
export type ApplicationError = (typeof ApplicationError.values)[number];

// ─── Onboarding ─────────────────────────────────────────────────────────────

export const OnboardingError = defineEnum([
  "invalid_code",
  "code_expired",
  "email_mismatch",
  "email_not_verified",
] as const);
export type OnboardingError = (typeof OnboardingError.values)[number];

// ─── Settings ───────────────────────────────────────────────────────────────

export const SettingsError = defineEnum(["no_data", "invalid_locale"] as const);
export type SettingsError = (typeof SettingsError.values)[number];

// ─── Join house ─────────────────────────────────────────────────────────────

export const JoinError = defineEnum([
  "invalid_link",
  "already_member",
  "link_expired",
  "link_max_used",
] as const);
export type JoinError = (typeof JoinError.values)[number];

// ─── Chat ───────────────────────────────────────────────────────────────────

export const ChatError = defineEnum(["cannot_block_self"] as const);
export type ChatError = (typeof ChatError.values)[number];

// ─── Events ─────────────────────────────────────────────────────────────────

export const EventError = defineEnum([
  "event_cancelled",
  "deadline_passed",
  "event_full",
  "no_applications",
  "too_many_invitations",
] as const);
export type EventError = (typeof EventError.values)[number];
