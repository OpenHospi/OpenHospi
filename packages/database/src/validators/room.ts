import {
  MAX_PHOTO_CAPTION_LENGTH,
  MAX_ROOM_DESCRIPTION_LENGTH,
  MAX_ROOM_TITLE_LENGTH,
} from "@openhospi/shared/constants";
import {
  City,
  Furnishing,
  GenderPreference,
  HouseType,
  Language,
  LifestyleTag,
  LocationTag,
  RentalType,
  RoomFeature,
  Vereniging,
} from "@openhospi/shared/enums";
import { createInsertSchema } from "drizzle-orm/zod";
import { z } from "zod";

import { roomPhotos, rooms } from "../schema/rooms";

const DUTCH_POSTAL_CODE_REGEX = /^\d{4}\s?[A-Za-z]{2}$/;

const baseRoomSchema = createInsertSchema(rooms, {
  title: z.string().min(1).max(MAX_ROOM_TITLE_LENGTH),
  description: z.string().max(MAX_ROOM_DESCRIPTION_LENGTH).optional(),
  city: z.enum(City.values),
  neighborhood: z.string().max(100).optional(),
  streetName: z.string().max(100).optional(),
  houseNumber: z.string().max(20).optional(),
  postalCode: z.string().regex(DUTCH_POSTAL_CODE_REGEX, "Invalid postal code").optional(),
  latitude: z.coerce.number().min(-90).max(90).optional(),
  longitude: z.coerce.number().min(-180).max(180).optional(),
  rentPrice: z.coerce.number().min(0).max(99999),
  deposit: z.coerce.number().min(0).max(99999).optional(),
  utilitiesIncluded: z.boolean().optional(),
  serviceCosts: z.coerce.number().min(0).max(99999).optional(),
  roomSizeM2: z.coerce.number().int().min(1).max(999).optional(),
  availableFrom: z.string().min(1),
  availableUntil: z.string().optional(),
  rentalType: z.enum(RentalType.values),
  houseType: z.enum(HouseType.values).optional(),
  furnishing: z.enum(Furnishing.values).optional(),
  totalHousemates: z.coerce.number().int().min(1).max(50).optional(),
  features: z.array(z.enum(RoomFeature.values)).optional(),
  locationTags: z.array(z.enum(LocationTag.values)).optional(),
  preferredGender: z.enum(GenderPreference.values).optional(),
  preferredAgeMin: z.coerce.number().int().min(16).max(99).optional(),
  preferredAgeMax: z.coerce.number().int().min(16).max(99).optional(),
  preferredLifestyleTags: z.array(z.enum(LifestyleTag.values)).optional(),
  acceptedLanguages: z.array(z.enum(Language.values)).optional(),
  roomVereniging: z.enum(Vereniging.values).optional(),
  shareLinkExpiresAt: z.string().optional(),
  shareLinkMaxUses: z.coerce.number().int().min(1).max(10000).optional(),
});

export const roomBasicInfoSchema = baseRoomSchema.pick({
  title: true,
  description: true,
  city: true,
  neighborhood: true,
  streetName: true,
  houseNumber: true,
  postalCode: true,
  latitude: true,
  longitude: true,
});

export const roomDetailsSchema = baseRoomSchema
  .pick({
    rentPrice: true,
    deposit: true,
    utilitiesIncluded: true,
    serviceCosts: true,
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
      if (data.rentalType === RentalType.permanent) return true;
      return !!data.availableUntil;
    },
    { message: "availableUntil is required for sublet/temporary", path: ["availableUntil"] },
  );

export const roomPreferencesSchema = baseRoomSchema.pick({
  features: true,
  locationTags: true,
  preferredGender: true,
  preferredAgeMin: true,
  preferredAgeMax: true,
  preferredLifestyleTags: true,
  acceptedLanguages: true,
  roomVereniging: true,
});

export const editRoomSchema = baseRoomSchema
  .pick({
    title: true,
    description: true,
    city: true,
    neighborhood: true,
    streetName: true,
    houseNumber: true,
    postalCode: true,
    latitude: true,
    longitude: true,
    rentPrice: true,
    deposit: true,
    utilitiesIncluded: true,
    serviceCosts: true,
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
    acceptedLanguages: true,
    roomVereniging: true,
  })
  .refine(
    (data) => {
      if (data.rentalType === RentalType.permanent) return true;
      return !!data.availableUntil;
    },
    { message: "availableUntil is required for sublet/temporary", path: ["availableUntil"] },
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
