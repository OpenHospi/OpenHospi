export const APP_NAME = "OpenHospi";

export const DEFAULT_LOCALE = "nl" as const;
export const SUPPORTED_LOCALES = ["nl", "en", "de"] as const;
export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];

// Length limits (match SQL CHECK constraints)
export const MAX_BIO_LENGTH = 1000;
export const MAX_PERSONAL_MESSAGE_LENGTH = 2000;
export const MAX_ROOM_TITLE_LENGTH = 200;
export const MAX_ROOM_DESCRIPTION_LENGTH = 5000;
export const MAX_STUDY_PROGRAM_LENGTH = 200;
export const MAX_NOTES_LENGTH = 2000;
export const MAX_INSTAGRAM_HANDLE_LENGTH = 30;

// Photo limits
export const MAX_PROFILE_PHOTOS = 5;
export const MAX_ROOM_PHOTOS = 10;
export const MAX_PHOTO_CAPTION_LENGTH = 200;

// Lifestyle tag limits
export const MIN_LIFESTYLE_TAGS = 2;
export const MAX_LIFESTYLE_TAGS = 8;

// Language selection limits
export const MIN_LANGUAGES = 1;
export const MAX_LANGUAGES = 5;

// Pagination
export const ROOMS_PER_PAGE = 12;
export const APPLICATIONS_PER_PAGE = 12;
export const MAX_APPLICANTS_PER_PAGE = 100;

// Application
export const MIN_PERSONAL_MESSAGE_LENGTH = 50;

// Hospi events
export const MAX_EVENT_TITLE_LENGTH = 200;
export const MAX_EVENT_DESCRIPTION_LENGTH = 2000;
export const MAX_EVENT_LOCATION_LENGTH = 300;
export const MAX_EVENT_NOTES_LENGTH = 2000;
export const MAX_DECLINE_REASON_LENGTH = 500;
export const MAX_INVITATIONS_PER_EVENT = 20;

// Reminders & notifications
export const REMINDER_HOURS_BEFORE_EVENT = 24;
export const NOTIFICATIONS_PER_PAGE = 20;
export const MESSAGES_PER_PAGE = 50;

// File size limits (bytes)
export const MAX_AVATAR_SIZE = 5 * 1024 * 1024; // 5 MB
export const MAX_ROOM_PHOTO_SIZE = 10 * 1024 * 1024; // 10 MB
export const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
] as const;
export type AllowedImageType = (typeof ALLOWED_IMAGE_TYPES)[number];
