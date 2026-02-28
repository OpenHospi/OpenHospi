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
  LifestyleTag,
  LocationTag,
  RentalType,
  RoomFeature,
  Vereniging,
} from "@openhospi/shared/enums";
import { createInsertSchema } from "drizzle-orm/zod";
import { z } from "zod";

import { roomPhotos, rooms } from "../schema/rooms";

const baseRoomSchema = createInsertSchema(rooms, {
  title: z.string().min(1).max(MAX_ROOM_TITLE_LENGTH),
  description: z.string().max(MAX_ROOM_DESCRIPTION_LENGTH).optional(),
  city: z.enum(City.values),
  neighborhood: z.string().max(100).optional(),
  address: z.string().max(200).optional(),
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
  roomVereniging: z.enum(Vereniging.values).optional(),
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
