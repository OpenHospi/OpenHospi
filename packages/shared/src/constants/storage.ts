// Supabase storage bucket names
export const STORAGE_BUCKET_PROFILE_PHOTOS = "profile-photos";
export const STORAGE_BUCKET_ROOM_PHOTOS = "room-photos";

export type StorageBucket =
  | typeof STORAGE_BUCKET_PROFILE_PHOTOS
  | typeof STORAGE_BUCKET_ROOM_PHOTOS;

// Consent & cookie storage
export const CONSENT_STORAGE_KEY = "openhospi_consent";
export const CONSENT_CHANGE_EVENT = "openhospi:consent-change";
