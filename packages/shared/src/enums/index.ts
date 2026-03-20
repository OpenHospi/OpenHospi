// Central re-export — all enums are defined in their own domain files.
// Every enum maps 1:1 to a SQL enum and translation key: enums.{enum_name}.{value}

export { Gender, GenderPreference, Language, LifestyleTag, StudyLevel } from "./identity";

export {
  Furnishing,
  HouseType,
  LocationTag,
  RentalType,
  RoomFeature,
  RoomStatus,
  UtilitiesIncluded,
} from "./housing";

export {
  ApplicationStatus,
  HouseMemberRole,
  InvitationStatus,
  ReviewDecision,
} from "./applications";

export { DevicePlatform, SenderKeyDistributionStatus } from "./encryption";

export { DeliveryStatus, MessageType } from "./chat";

export { AdminAction, ReportReason, ReportStatus, ReportType } from "./admin";

export { DiscoverSort } from "./discover";

export { ConsentPurpose, DataRequestStatus, DataRequestType, LegalBasis } from "./privacy";

export { City } from "./cities";

export { Vereniging } from "./verenigingen";

export {
  INVITABLE_APPLICATION_STATUSES,
  REVIEW_DECISION_TO_APPLICATION_STATUS,
  REVIEW_PHASE_STATUSES,
  TERMINAL_APPLICATION_STATUSES,
  VALID_APPLICATION_TRANSITIONS,
  VALID_INVITATION_TRANSITIONS,
  VALID_REPORT_STATUS_TRANSITIONS,
  VALID_ROOM_TRANSITIONS,
  isReviewPhaseStatus,
  isTerminalApplicationStatus,
  isValidApplicationTransition,
  isValidInvitationTransition,
  isValidReportStatusTransition,
  isValidRoomTransition,
} from "./transitions";
