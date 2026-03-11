// Photo counts
export const MAX_PROFILE_PHOTOS = 5;
export const MAX_ROOM_PHOTOS = 10;
export const MAX_PHOTO_CAPTION_LENGTH = 200;
export const ROOM_PHOTO_SLOTS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] as const;
export type RoomPhotoSlot = (typeof ROOM_PHOTO_SLOTS)[number];

// File size limits (bytes)
export const MAX_AVATAR_SIZE = 5 * 1024 * 1024; // 5 MB
export const MAX_ROOM_PHOTO_SIZE = 10 * 1024 * 1024; // 10 MB

// Allowed image MIME types
export const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
] as const;
export type AllowedImageType = (typeof ALLOWED_IMAGE_TYPES)[number];

// JPEG compression quality (0–100 scale, used by Sharp on web)
export const JPEG_QUALITY = 85;
