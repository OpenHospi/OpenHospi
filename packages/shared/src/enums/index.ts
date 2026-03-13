// Single source of truth for UI + validation
// Every enum maps 1:1 to a SQL enum and translation key: enums.{enum_name}.{value}

import { defineEnum } from "./define-enum";

// ─── Identity enums ───────────────────────────────────────────────────────

export const Gender = defineEnum(["male", "female", "prefer_not_to_say"] as const);
export type Gender = (typeof Gender.values)[number];

export const GenderPreference = defineEnum(["male", "female", "no_preference"] as const);
export type GenderPreference = (typeof GenderPreference.values)[number];

export const Language = defineEnum([
  "nl",
  "en",
  "de",
  "fr",
  "es",
  "it",
  "pt",
  "zh",
  "ar",
  "tr",
  "pl",
  "hi",
  "ja",
  "ko",
] as const);
export type Language = (typeof Language.values)[number];

export const StudyLevel = defineEnum([
  "mbo",
  "hbo_propedeuse",
  "hbo_bachelor",
  "wo_propedeuse",
  "wo_bachelor",
  "pre_master",
  "master",
  "phd",
] as const);
export type StudyLevel = (typeof StudyLevel.values)[number];

// ─── Lifestyle & personality ──────────────────────────────────────────────

export const LifestyleTag = defineEnum([
  // Social vibe
  "sociable",
  "quiet",
  "introvert",
  "extrovert",
  // Activities
  "sports",
  "cooking",
  "gaming",
  "music",
  "nightlife",
  "partying",
  "studying",
  "reading",
  "traveling",
  "movie_night",
  "creative",
  // Living rhythm
  "early_bird",
  "night_owl",
  // Household
  "tidy",
  "relaxed_cleaning",
  // Diet & lifestyle
  "vegetarian",
  "vegan",
  "sustainable",
  // Social values
  "inclusive",
  "international",
  "pets",
] as const);
export type LifestyleTag = (typeof LifestyleTag.values)[number];

// ─── Housing ──────────────────────────────────────────────────────────────

export const HouseType = defineEnum([
  "student_house",
  "apartment",
  "studio",
  "living_group",
  "anti_squat",
] as const);
export type HouseType = (typeof HouseType.values)[number];

export const RoomStatus = defineEnum(["draft", "active", "paused", "closed"] as const);
export type RoomStatus = (typeof RoomStatus.values)[number];

export const Furnishing = defineEnum(["unfurnished", "semi_furnished", "furnished"] as const);
export type Furnishing = (typeof Furnishing.values)[number];

export const RoomFeature = defineEnum([
  "private_bathroom",
  "shared_bathroom",
  "private_kitchen",
  "shared_kitchen",
  "balcony",
  "garden",
  "terrace",
  "storage",
  "parking",
  "bike_storage",
  "washing_machine",
  "dryer",
  "dishwasher",
  "wifi_included",
  "pets_allowed",
  "smoking_allowed",
  "no_pets",
  "no_smoking",
] as const);
export type RoomFeature = (typeof RoomFeature.values)[number];

export const UtilitiesIncluded = defineEnum(["included", "not_included", "estimated"] as const);
export type UtilitiesIncluded = (typeof UtilitiesIncluded.values)[number];

export const RentalType = defineEnum(["permanent", "sublet", "temporary"] as const);
export type RentalType = (typeof RentalType.values)[number];

export const LocationTag = defineEnum([
  "near_university",
  "near_station",
  "near_transit",
  "near_center",
  "near_supermarket",
  "near_nightlife",
  "near_sports_center",
  "near_park",
  "quiet_neighborhood",
  "lively_neighborhood",
] as const);
export type LocationTag = (typeof LocationTag.values)[number];

// ─── Applications & reviews ───────────────────────────────────────────────

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

// ─── Devices / Encryption ─────────────────────────────────────────────────

export const DevicePlatform = defineEnum(["web", "ios", "android"] as const);
export type DevicePlatform = (typeof DevicePlatform.values)[number];

export const SenderKeyDistributionStatus = defineEnum(["pending", "delivered"] as const);
export type SenderKeyDistributionStatus = (typeof SenderKeyDistributionStatus.values)[number];

// ─── Chat ─────────────────────────────────────────────────────────────────

export const ConversationType = defineEnum(["direct", "house"] as const);
export type ConversationType = (typeof ConversationType.values)[number];

export const MessageType = defineEnum(["text", "system"] as const);
export type MessageType = (typeof MessageType.values)[number];

export const DeliveryStatus = defineEnum(["sent", "delivered", "read"] as const);
export type DeliveryStatus = (typeof DeliveryStatus.values)[number];

// ─── Admin & reports ──────────────────────────────────────────────────────

export const AdminAction = defineEnum([
  "view_report",
  "update_report",
  "suspend_user",
  "unsuspend_user",
  "remove_listing",
  "remove_message",
  "dismiss_report",
  "process_data_request",
  "lift_restriction",
  "export_user_data",
  "view_user_data",
] as const);
export type AdminAction = (typeof AdminAction.values)[number];

export const ReportReason = defineEnum([
  "spam",
  "harassment",
  "fake_profile",
  "inappropriate_content",
  "scam",
  "discrimination",
  "other",
] as const);
export type ReportReason = (typeof ReportReason.values)[number];

export const ReportType = defineEnum(["message", "user", "room"] as const);
export type ReportType = (typeof ReportType.values)[number];

export const ReportStatus = defineEnum(["pending", "reviewing", "resolved", "dismissed"] as const);
export type ReportStatus = (typeof ReportStatus.values)[number];

// ─── Discover ─────────────────────────────────────────────────────────────

export const DiscoverSort = defineEnum(["newest", "cheapest", "most_expensive"] as const);
export type DiscoverSort = (typeof DiscoverSort.values)[number];

// ─── GDPR / Privacy ──────────────────────────────────────────────────────

export const ConsentPurpose = defineEnum([
  "essential",
  "functional",
  "push_notifications",
  "analytics",
] as const);
export type ConsentPurpose = (typeof ConsentPurpose.values)[number];

export const LegalBasis = defineEnum([
  "consent",
  "contract",
  "legal_obligation",
  "legitimate_interest",
] as const);
export type LegalBasis = (typeof LegalBasis.values)[number];

export const DataRequestType = defineEnum([
  "access",
  "rectification",
  "erasure",
  "restriction",
  "portability",
  "objection",
] as const);
export type DataRequestType = (typeof DataRequestType.values)[number];

export const DataRequestStatus = defineEnum([
  "pending",
  "in_progress",
  "completed",
  "denied",
] as const);
export type DataRequestStatus = (typeof DataRequestStatus.values)[number];

// ─── Re-exports from sub-files ────────────────────────────────────────────

export { City } from "./cities";

export { Vereniging } from "./verenigingen";

export {
  VALID_INVITATION_TRANSITIONS,
  isValidInvitationTransition,
  VALID_APPLICATION_TRANSITIONS,
  isValidApplicationTransition,
  VALID_ROOM_TRANSITIONS,
  isValidRoomTransition,
  VALID_REPORT_STATUS_TRANSITIONS,
  isValidReportStatusTransition,
  TERMINAL_APPLICATION_STATUSES,
  isTerminalApplicationStatus,
  INVITABLE_APPLICATION_STATUSES,
  REVIEW_PHASE_STATUSES,
  isReviewPhaseStatus,
  REVIEW_DECISION_TO_APPLICATION_STATUS,
} from "./transitions";
