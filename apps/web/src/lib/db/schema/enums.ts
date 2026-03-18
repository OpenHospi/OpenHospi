import { SUPPORTED_LOCALES } from "@openhospi/i18n";
import {
  AdminAction,
  ApplicationStatus,
  City,
  ConsentPurpose,
  DataRequestStatus,
  DataRequestType,
  DeliveryStatus,
  DevicePlatform,
  DiscoverSort,
  Furnishing,
  Gender,
  GenderPreference,
  HouseMemberRole,
  HouseType,
  InvitationStatus,
  Language,
  LegalBasis,
  LifestyleTag,
  LocationTag,
  MessageType,
  RentalType,
  ReportReason,
  ReportStatus,
  ReportType,
  ReviewDecision,
  RoomFeature,
  RoomStatus,
  SenderKeyDistributionStatus,
  StudyLevel,
  UtilitiesIncluded,
  Vereniging,
} from "@openhospi/shared/enums";
import { pgEnum } from "drizzle-orm/pg-core";

export const genderEnum = pgEnum("gender_enum", Gender.values);
export const genderPreferenceEnum = pgEnum("gender_preference_enum", GenderPreference.values);
export const languageEnum = pgEnum("language_enum", Language.values);
export const studyLevelEnum = pgEnum("study_level_enum", StudyLevel.values);
export const lifestyleTagEnum = pgEnum("lifestyle_tag_enum", LifestyleTag.values);
export const houseTypeEnum = pgEnum("house_type_enum", HouseType.values);
export const roomStatusEnum = pgEnum("room_status_enum", RoomStatus.values);
export const furnishingEnum = pgEnum("furnishing_enum", Furnishing.values);
export const roomFeatureEnum = pgEnum("room_feature_enum", RoomFeature.values);
export const rentalTypeEnum = pgEnum("rental_type_enum", RentalType.values);
export const locationTagEnum = pgEnum("location_tag_enum", LocationTag.values);
export const cityEnum = pgEnum("city_enum", City.values);
export const applicationStatusEnum = pgEnum("application_status_enum", ApplicationStatus.values);
export const reviewDecisionEnum = pgEnum("review_decision_enum", ReviewDecision.values);
export const invitationStatusEnum = pgEnum("invitation_status_enum", InvitationStatus.values);
export const houseMemberRoleEnum = pgEnum("house_member_role_enum", HouseMemberRole.values);
export const adminActionEnum = pgEnum("admin_action_enum", AdminAction.values);
export const reportReasonEnum = pgEnum("report_reason_enum", ReportReason.values);
export const reportStatusEnum = pgEnum("report_status_enum", ReportStatus.values);
export const reportTypeEnum = pgEnum("report_type_enum", ReportType.values);
export const discoverSortEnum = pgEnum("discover_sort_enum", DiscoverSort.values);
export const utilitiesIncludedEnum = pgEnum("utilities_included_enum", UtilitiesIncluded.values);
export const verenigingEnum = pgEnum("vereniging_enum", Vereniging.values);
export const localeEnum = pgEnum("locale_enum", SUPPORTED_LOCALES);
export const consentPurposeEnum = pgEnum("consent_purpose_enum", ConsentPurpose.values);
export const legalBasisEnum = pgEnum("legal_basis_enum", LegalBasis.values);
export const dataRequestTypeEnum = pgEnum("data_request_type_enum", DataRequestType.values);
export const dataRequestStatusEnum = pgEnum("data_request_status_enum", DataRequestStatus.values);
export const platformEnum = pgEnum("platform_enum", DevicePlatform.values);
export const messageTypeEnum = pgEnum("message_type_enum", MessageType.values);
export const deliveryStatusEnum = pgEnum("delivery_status_enum", DeliveryStatus.values);
export const senderKeyDistributionStatusEnum = pgEnum(
  "sender_key_distribution_status_enum",
  SenderKeyDistributionStatus.values,
);
