import {
  MAX_PHOTO_CAPTION_LENGTH,
  MAX_ROOM_DESCRIPTION_LENGTH,
  MAX_ROOM_TITLE_LENGTH,
} from "@openhospi/shared/constants";
import {
  CITIES,
  FURNISHINGS,
  GENDER_PREFERENCES,
  HOUSE_TYPES,
  LIFESTYLE_TAGS,
  LOCATION_TAGS,
  RENTAL_TYPES,
  ROOM_FEATURES,
} from "@openhospi/shared/enums";
import { z } from "zod";

export const roomBasicInfoSchema = z.object({
  title: z.string().min(1).max(MAX_ROOM_TITLE_LENGTH),
  description: z.string().max(MAX_ROOM_DESCRIPTION_LENGTH).optional(),
  city: z.enum(CITIES),
  neighborhood: z.string().max(100).optional(),
  address: z.string().max(200).optional(),
});

export const roomDetailsSchema = z
  .object({
    rent_price: z.coerce.number().min(0).max(99999),
    deposit: z.coerce.number().min(0).max(99999).optional(),
    utilities_included: z.boolean().optional(),
    room_size_m2: z.coerce.number().int().min(1).max(999).optional(),
    available_from: z.string().min(1),
    available_until: z.string().optional(),
    rental_type: z.enum(RENTAL_TYPES),
    house_type: z.enum(HOUSE_TYPES).optional(),
    furnishing: z.enum(FURNISHINGS).optional(),
    total_housemates: z.coerce.number().int().min(1).max(50).optional(),
  })
  .refine(
    (data) => {
      if (data.rental_type === "vast") return true;
      return !!data.available_until;
    },
    { message: "available_until is required for onderhuur/tijdelijk", path: ["available_until"] },
  );

export const roomPreferencesSchema = z.object({
  features: z.array(z.enum(ROOM_FEATURES)).optional(),
  location_tags: z.array(z.enum(LOCATION_TAGS)).optional(),
  preferred_gender: z.enum(GENDER_PREFERENCES).optional(),
  preferred_age_min: z.coerce.number().int().min(16).max(99).optional(),
  preferred_age_max: z.coerce.number().int().min(16).max(99).optional(),
  preferred_lifestyle_tags: z.array(z.enum(LIFESTYLE_TAGS)).optional(),
  is_verenigingshuis: z.boolean().optional(),
  room_vereniging: z.string().max(100).optional(),
});

export const editRoomSchema = z
  .object({
    title: z.string().min(1).max(MAX_ROOM_TITLE_LENGTH),
    description: z.string().max(MAX_ROOM_DESCRIPTION_LENGTH).optional(),
    city: z.enum(CITIES),
    neighborhood: z.string().max(100).optional(),
    address: z.string().max(200).optional(),
    rent_price: z.coerce.number().min(0).max(99999),
    deposit: z.coerce.number().min(0).max(99999).optional(),
    utilities_included: z.boolean().optional(),
    room_size_m2: z.coerce.number().int().min(1).max(999).optional(),
    available_from: z.string().min(1),
    available_until: z.string().optional(),
    rental_type: z.enum(RENTAL_TYPES),
    house_type: z.enum(HOUSE_TYPES).optional(),
    furnishing: z.enum(FURNISHINGS).optional(),
    total_housemates: z.coerce.number().int().min(1).max(50).optional(),
    features: z.array(z.enum(ROOM_FEATURES)).optional(),
    location_tags: z.array(z.enum(LOCATION_TAGS)).optional(),
    preferred_gender: z.enum(GENDER_PREFERENCES).optional(),
    preferred_age_min: z.coerce.number().int().min(16).max(99).optional(),
    preferred_age_max: z.coerce.number().int().min(16).max(99).optional(),
    preferred_lifestyle_tags: z.array(z.enum(LIFESTYLE_TAGS)).optional(),
    is_verenigingshuis: z.boolean().optional(),
    room_vereniging: z.string().max(100).optional(),
  })
  .refine(
    (data) => {
      if (data.rental_type === "vast") return true;
      return !!data.available_until;
    },
    { message: "available_until is required for onderhuur/tijdelijk", path: ["available_until"] },
  );

export const shareLinkSettingsSchema = z.object({
  share_link_expires_at: z.string().optional(),
  share_link_max_uses: z.coerce.number().int().min(1).max(10000).optional(),
});

export const roomPhotoCaptionSchema = z.object({
  caption: z.string().max(MAX_PHOTO_CAPTION_LENGTH).optional(),
});

export type RoomBasicInfoData = z.infer<typeof roomBasicInfoSchema>;
export type RoomDetailsData = z.infer<typeof roomDetailsSchema>;
export type RoomPreferencesData = z.infer<typeof roomPreferencesSchema>;
export type EditRoomData = z.infer<typeof editRoomSchema>;
export type ShareLinkSettingsData = z.infer<typeof shareLinkSettingsSchema>;
