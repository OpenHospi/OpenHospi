import { defineEnum } from "./utils/define-enum";

export const HouseType = defineEnum([
  "student_house",
  "apartment",
  "studio",
  "living_group",
  "anti_squat",
] as const);
export type HouseType = (typeof HouseType.values)[number];

export const RoomStatus = defineEnum(["draft", "active", "paused", "closed"] as const);
export type RoomStatus = (typeof RoomStatus.values)[number];

export const Furnishing = defineEnum(["unfurnished", "semi_furnished", "furnished"] as const);
export type Furnishing = (typeof Furnishing.values)[number];

export const RoomFeature = defineEnum([
  "private_bathroom",
  "shared_bathroom",
  "private_kitchen",
  "shared_kitchen",
  "balcony",
  "garden",
  "terrace",
  "storage",
  "parking",
  "bike_storage",
  "washing_machine",
  "dryer",
  "dishwasher",
  "wifi_included",
  "pets_allowed",
  "smoking_allowed",
  "no_pets",
  "no_smoking",
] as const);
export type RoomFeature = (typeof RoomFeature.values)[number];

export const UtilitiesIncluded = defineEnum(["included", "not_included", "estimated"] as const);
export type UtilitiesIncluded = (typeof UtilitiesIncluded.values)[number];

export const RentalType = defineEnum(["permanent", "sublet", "temporary"] as const);
export type RentalType = (typeof RentalType.values)[number];

export const LocationTag = defineEnum([
  "near_university",
  "near_station",
  "near_transit",
  "near_center",
  "near_supermarket",
  "near_nightlife",
  "near_sports_center",
  "near_park",
  "quiet_neighborhood",
  "lively_neighborhood",
] as const);
export type LocationTag = (typeof LocationTag.values)[number];
