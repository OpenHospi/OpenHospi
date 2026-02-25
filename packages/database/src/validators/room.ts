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
  VERENIGINGEN,
} from "@openhospi/shared/enums";
import { createInsertSchema } from "drizzle-orm/zod";
import { z } from "zod";

import { roomPhotos, rooms } from "../schema/rooms";

const baseRoomSchema = createInsertSchema(rooms, {
  title: z.string().min(1).max(MAX_ROOM_TITLE_LENGTH),
  description: z.string().max(MAX_ROOM_DESCRIPTION_LENGTH).optional(),
  city: z.enum(CITIES),
  neighborhood: z.string().max(100).optional(),
  address: z.string().max(200).optional(),
  rentPrice: z.coerce.number().min(0).max(99999),
  deposit: z.coerce.number().min(0).max(99999).optional(),
  utilitiesIncluded: z.boolean().optional(),
  roomSizeM2: z.coerce.number().int().min(1).max(999).optional(),
  availableFrom: z.string().min(1),
  availableUntil: z.string().optional(),
  rentalType: z.enum(RENTAL_TYPES),
  houseType: z.enum(HOUSE_TYPES).optional(),
  furnishing: z.enum(FURNISHINGS).optional(),
  totalHousemates: z.coerce.number().int().min(1).max(50).optional(),
  features: z.array(z.enum(ROOM_FEATURES)).optional(),
  locationTags: z.array(z.enum(LOCATION_TAGS)).optional(),
  preferredGender: z.enum(GENDER_PREFERENCES).optional(),
  preferredAgeMin: z.coerce.number().int().min(16).max(99).optional(),
  preferredAgeMax: z.coerce.number().int().min(16).max(99).optional(),
  preferredLifestyleTags: z.array(z.enum(LIFESTYLE_TAGS)).optional(),
  roomVereniging: z.enum(VERENIGINGEN).optional(),
  shareLinkExpiresAt: z.string().optional(),
  shareLinkMaxUses: z.coerce.number().int().min(1).max(10000).optional(),
});

export const roomBasicInfoSchema = baseRoomSchema.pick({
  title: true,
  description: true,
  city: true,
  neighborhood: true,
  address: true,
});

export const roomDetailsSchema = baseRoomSchema
  .pick({
    rentPrice: true,
    deposit: true,
    utilitiesIncluded: true,
    roomSizeM2: true,
    availableFrom: true,
    availableUntil: true,
    rentalType: true,
    houseType: true,
    furnishing: true,
    totalHousemates: true,
  })
  .refine(
    (data) => {
      if (data.rentalType === "vast") return true;
      return !!data.availableUntil;
    },
    { message: "availableUntil is required for onderhuur/tijdelijk", path: ["availableUntil"] },
  );

export const roomPreferencesSchema = baseRoomSchema.pick({
  features: true,
  locationTags: true,
  preferredGender: true,
  preferredAgeMin: true,
  preferredAgeMax: true,
  preferredLifestyleTags: true,
  roomVereniging: true,
});

export const editRoomSchema = baseRoomSchema
  .pick({
    title: true,
    description: true,
    city: true,
    neighborhood: true,
    address: true,
    rentPrice: true,
    deposit: true,
    utilitiesIncluded: true,
    roomSizeM2: true,
    availableFrom: true,
    availableUntil: true,
    rentalType: true,
    houseType: true,
    furnishing: true,
    totalHousemates: true,
    features: true,
    locationTags: true,
    preferredGender: true,
    preferredAgeMin: true,
    preferredAgeMax: true,
    preferredLifestyleTags: true,
    roomVereniging: true,
  })
  .refine(
    (data) => {
      if (data.rentalType === "vast") return true;
      return !!data.availableUntil;
    },
    { message: "availableUntil is required for onderhuur/tijdelijk", path: ["availableUntil"] },
  );

export const shareLinkSettingsSchema = baseRoomSchema.pick({
  shareLinkExpiresAt: true,
  shareLinkMaxUses: true,
});

export const roomPhotoCaptionSchema = createInsertSchema(roomPhotos, {
  caption: z.string().max(MAX_PHOTO_CAPTION_LENGTH).optional(),
}).pick({ caption: true });

export type RoomBasicInfoData = z.infer<typeof roomBasicInfoSchema>;
export type RoomDetailsData = z.infer<typeof roomDetailsSchema>;
export type RoomPreferencesData = z.infer<typeof roomPreferencesSchema>;
export type EditRoomData = z.infer<typeof editRoomSchema>;
export type ShareLinkSettingsData = z.infer<typeof shareLinkSettingsSchema>;
