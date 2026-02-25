import { pgEnum } from "drizzle-orm/pg-core";

import {
  ADMIN_ACTIONS,
  AFFILIATIONS,
  APPLICATION_STATUSES,
  CITIES,
  CONVERSATION_TYPES,
  DELIVERY_STATUSES,
  FURNISHINGS,
  GENDER_PREFERENCES,
  GENDERS,
  HOUSEMATE_ROLES,
  HOUSE_TYPES,
  INVITATION_STATUSES,
  LANGUAGES,
  LIFESTYLE_TAGS,
  LOCATION_TAGS,
  MESSAGE_TYPES,
  RENTAL_TYPES,
  REPORT_REASONS,
  REPORT_STATUSES,
  REVIEW_DECISIONS,
  ROOM_FEATURES,
  ROOM_STATUSES,
  STUDY_LEVELS,
  VERENIGINGEN,
} from "@openhospi/shared/enums";

export const genderEnum = pgEnum("gender_enum", GENDERS);
export const genderPreferenceEnum = pgEnum("gender_preference_enum", GENDER_PREFERENCES);
export const languageEnum = pgEnum("language_enum", LANGUAGES);
export const affiliationEnum = pgEnum("affiliation_enum", AFFILIATIONS);
export const studyLevelEnum = pgEnum("study_level_enum", STUDY_LEVELS);
export const lifestyleTagEnum = pgEnum("lifestyle_tag_enum", LIFESTYLE_TAGS);
export const houseTypeEnum = pgEnum("house_type_enum", HOUSE_TYPES);
export const roomStatusEnum = pgEnum("room_status_enum", ROOM_STATUSES);
export const furnishingEnum = pgEnum("furnishing_enum", FURNISHINGS);
export const roomFeatureEnum = pgEnum("room_feature_enum", ROOM_FEATURES);
export const rentalTypeEnum = pgEnum("rental_type_enum", RENTAL_TYPES);
export const locationTagEnum = pgEnum("location_tag_enum", LOCATION_TAGS);
export const cityEnum = pgEnum("city_enum", CITIES);
export const applicationStatusEnum = pgEnum("application_status_enum", APPLICATION_STATUSES);
export const reviewDecisionEnum = pgEnum("review_decision_enum", REVIEW_DECISIONS);
export const invitationStatusEnum = pgEnum("invitation_status_enum", INVITATION_STATUSES);
export const housemateRoleEnum = pgEnum("housemate_role_enum", HOUSEMATE_ROLES);
export const conversationTypeEnum = pgEnum("conversation_type_enum", CONVERSATION_TYPES);
export const messageTypeEnum = pgEnum("message_type_enum", MESSAGE_TYPES);
export const deliveryStatusEnum = pgEnum("delivery_status_enum", DELIVERY_STATUSES);
export const adminActionEnum = pgEnum("admin_action_enum", ADMIN_ACTIONS);
export const reportReasonEnum = pgEnum("report_reason_enum", REPORT_REASONS);
export const reportStatusEnum = pgEnum("report_status_enum", REPORT_STATUSES);
export const verenigingEnum = pgEnum("vereniging_enum", VERENIGINGEN);
