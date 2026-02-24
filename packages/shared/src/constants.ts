export const APP_NAME = 'OpenHospi';

export const DEFAULT_LOCALE = 'nl' as const;
export const SUPPORTED_LOCALES = ['nl', 'en', 'de'] as const;

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

// Pagination
export const ROOMS_PER_PAGE = 12;

// File size limits (bytes)
export const MAX_AVATAR_SIZE = 5 * 1024 * 1024; // 5 MB
export const MAX_ROOM_PHOTO_SIZE = 5 * 1024 * 1024; // 5 MB
export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const;
