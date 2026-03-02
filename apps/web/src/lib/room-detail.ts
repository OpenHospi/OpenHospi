import type {
  ApplicationStatus,
  City,
  Furnishing,
  GenderPreference,
  HouseType,
  Language,
  LocationTag,
  RentalType,
  RoomFeature,
  StudyLevel,
  UtilitiesIncluded,
} from "@openhospi/shared/enums";

import type { RoomDetailForApply } from "@/lib/applications";
import type { PublicRoom } from "@/lib/discover";

export type RoomDetail = {
  id: string;
  title: string;
  description: string | null;
  city: City;
  neighborhood: string | null;
  streetName: string | null;
  houseNumber: string | null;
  postalCode: string | null;
  latitude: number | null;
  longitude: number | null;
  rentPrice: number;
  deposit: number | null;
  utilitiesIncluded: UtilitiesIncluded | null;
  serviceCosts: number | null;
  estimatedUtilitiesCosts: number | null;
  totalCost: number;
  roomSizeM2: number | null;
  availableFrom: string | null;
  availableUntil: string | null;
  rentalType: RentalType | null;
  houseType: HouseType | null;
  furnishing: Furnishing | null;
  totalHousemates: number | null;
  features: RoomFeature[];
  locationTags: LocationTag[];
  preferredGender: GenderPreference | null;
  preferredAgeMin: number | null;
  preferredAgeMax: number | null;
  acceptedLanguages: Language[];
  ownerId: string | null;
  photos: { id: string; slot: number; url: string; caption: string | null }[];
  owner: {
    firstName: string;
    lastName: string;
    avatarUrl: string | null;
    studyProgram: string | null;
    studyLevel: StudyLevel | null;
    institutionDomain: string;
  } | null;
};

export type RoomDetailContext = {
  isAuthenticated: boolean;
  isOwner: boolean;
  isInvitee: boolean;
  existingApplication: { id: string; status: ApplicationStatus } | null;
  loginUrl: string | null;
};

export function publicRoomToDetail(room: PublicRoom): RoomDetail {
  return {
    id: room.id,
    title: room.title,
    description: room.description,
    city: room.city,
    neighborhood: room.neighborhood,
    streetName: null,
    houseNumber: null,
    postalCode: null,
    latitude: room.latitude,
    longitude: room.longitude,
    rentPrice: room.rentPrice,
    deposit: room.deposit,
    utilitiesIncluded: room.utilitiesIncluded,
    serviceCosts: room.serviceCosts,
    estimatedUtilitiesCosts: room.estimatedUtilitiesCosts,
    totalCost: room.totalCost,
    roomSizeM2: room.roomSizeM2,
    availableFrom: room.availableFrom,
    availableUntil: room.availableUntil,
    rentalType: room.rentalType,
    houseType: room.houseType,
    furnishing: room.furnishing,
    totalHousemates: room.totalHousemates,
    features: room.features,
    locationTags: room.locationTags,
    preferredGender: room.preferredGender,
    preferredAgeMin: room.preferredAgeMin,
    preferredAgeMax: room.preferredAgeMax,
    acceptedLanguages: [],
    ownerId: null,
    photos: room.photos,
    owner: null,
  };
}

export function applyRoomToDetail(room: RoomDetailForApply): RoomDetail {
  return {
    id: room.id,
    title: room.title,
    description: room.description,
    city: room.city,
    neighborhood: room.neighborhood,
    streetName: room.streetName,
    houseNumber: room.houseNumber,
    postalCode: room.postalCode,
    latitude: room.latitude,
    longitude: room.longitude,
    rentPrice: room.rentPrice,
    deposit: room.deposit,
    utilitiesIncluded: room.utilitiesIncluded,
    serviceCosts: room.serviceCosts,
    estimatedUtilitiesCosts: room.estimatedUtilitiesCosts,
    totalCost: room.totalCost,
    roomSizeM2: room.roomSizeM2,
    availableFrom: room.availableFrom,
    availableUntil: room.availableUntil,
    rentalType: room.rentalType,
    houseType: room.houseType,
    furnishing: room.furnishing,
    totalHousemates: room.totalHousemates,
    features: room.features,
    locationTags: room.locationTags,
    preferredGender: room.preferredGender,
    preferredAgeMin: room.preferredAgeMin,
    preferredAgeMax: room.preferredAgeMax,
    acceptedLanguages: room.acceptedLanguages,
    ownerId: room.ownerId,
    photos: room.photos,
    owner: room.owner,
  };
}
