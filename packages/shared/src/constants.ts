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

// Photo limits
export const MAX_PROFILE_PHOTOS = 5;
export const MAX_ROOM_PHOTOS = 10;
export const MAX_PHOTO_CAPTION_LENGTH = 200;
export const ROOM_PHOTO_SLOTS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] as const;
export type RoomPhotoSlot = (typeof ROOM_PHOTO_SLOTS)[number];

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

// Data retention (days)
export const RETENTION_SESSION_IP_DAYS = 30;
export const RETENTION_EXPIRED_SESSION_DAYS = 90;
export const RETENTION_REPORT_MESSAGE_TEXT_DAYS = 90;
export const RETENTION_READ_NOTIFICATION_DAYS = 180;
export const RETENTION_CONSENT_IP_DAYS = 365;

// Privacy policy version
export const PRIVACY_POLICY_VERSION = "1.0";

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

// Consent & cookie storage
export const CONSENT_STORAGE_KEY = "openhospi_consent";
export const CONSENT_CHANGE_EVENT = "openhospi:consent-change";

// IndexedDB (E2EE key storage)
export const INDEXED_DB_NAME = "openhospi-keys";
export const INDEXED_DB_STORE_NAME = "private-keys";
export const INDEXED_DB_VERSION = 1;

// Layout & responsive
export const MOBILE_BREAKPOINT = 768;
export const LEGAL_HEADER_OFFSET = 96;

// PDOK (Dutch address lookup)
export const PDOK_SUGGEST_URL =
  "https://api.pdok.nl/bzk/locatieserver/search/v3_1/suggest";
export const PDOK_LOOKUP_URL =
  "https://api.pdok.nl/bzk/locatieserver/search/v3_1/lookup";
export const PDOK_SUGGESTION_LIMIT = 6;

// External services
export const TRUSTPILOT_URL =
  "https://nl.trustpilot.com/review/openhospi.nl";
export const TRUSTPILOT_CACHE_REVALIDATE_SECONDS = 86400;

// Multi-step forms
export const ONBOARDING_TOTAL_STEPS = 5;
export const ROOM_CREATE_TOTAL_STEPS = 4;

// OG Image & icon dimensions
export const OG_IMAGE_SIZE = { width: 1200, height: 630 } as const;
export const APPLE_ICON_SIZE = { width: 180, height: 180 } as const;

// UX timings (milliseconds)
export const COPY_FEEDBACK_TIMEOUT_MS = 2000;
export const ADDRESS_DEBOUNCE_MS = 300;

// Auth
export const SESSION_COOKIE_NAME = "better-auth.session_token";

// Rate limits (per day)
export const RATE_LIMIT_APPLY = 20;
export const RATE_LIMIT_CREATE_ROOM = 5;
export const RATE_LIMIT_EXPORT_DATA = 3;
export const RATE_LIMIT_JOIN_SHARE_LINK = 10;
