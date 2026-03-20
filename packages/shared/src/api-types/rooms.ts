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
  RoomStatus,
  StudyLevel,
  UtilitiesIncluded,
} from "../enums";

export type RoomDetailPhoto = {
  id: string;
  slot: number;
  url: string;
  caption: string | null;
};

export type RoomOwner = {
  firstName: string;
  lastName: string;
  avatarUrl: string | null;
  studyProgram: string | null;
  studyLevel: StudyLevel | null;
  institutionDomain: string;
};

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
  roomVereniging: string | null;
  preferredGender: GenderPreference | null;
  preferredAgeMin: number | null;
  preferredAgeMax: number | null;
  acceptedLanguages: Language[];
  ownerId: string;
  createdAt: string;
  photos: RoomDetailPhoto[];
  owner: RoomOwner | null;
};

export type RoomDetailResponse = {
  room: RoomDetail;
  application: { id: string; status: ApplicationStatus } | null;
};

export type MyRoomSummary = {
  id: string;
  title: string;
  city: City;
  rentPrice: number;
  serviceCosts: number | null;
  totalCost: number;
  status: RoomStatus;
  coverPhotoUrl: string | null;
  applicantCount: number;
  createdAt: string;
};

export type MyRoomDetail = {
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
  serviceCosts: number | null;
  estimatedUtilitiesCosts: number | null;
  totalCost: number;
  utilitiesIncluded: UtilitiesIncluded | null;
  roomSizeM2: number | null;
  availableFrom: string | null;
  availableUntil: string | null;
  rentalType: RentalType | null;
  houseType: HouseType | null;
  furnishing: Furnishing | null;
  totalHousemates: number | null;
  features: RoomFeature[];
  locationTags: LocationTag[];
  roomVereniging: string | null;
  preferredGender: GenderPreference | null;
  preferredAgeMin: number | null;
  preferredAgeMax: number | null;
  acceptedLanguages: Language[];
  status: RoomStatus;
  shareLink: string | null;
  shareLinkExpiresAt: string | null;
  shareLinkMaxUses: number | null;
  shareLinkUseCount: number;
  photos: RoomDetailPhoto[];
  createdAt: string;
};
