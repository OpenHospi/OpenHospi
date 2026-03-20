import type {
  ApplicationStatus,
  City,
  Furnishing,
  GenderPreference,
  HouseType,
  InvitationStatus,
  Language,
  LocationTag,
  RentalType,
  RoomFeature,
  RoomStatus,
  StudyLevel,
  UtilitiesIncluded,
} from '@openhospi/shared/enums';

export type DiscoverRoom = {
  id: string;
  title: string;
  city: City;
  rentPrice: number;
  serviceCosts: number | null;
  totalCost: number;
  houseType: HouseType | null;
  furnishing: Furnishing | null;
  roomSizeM2: number | null;
  availableFrom: string | null;
  availableUntil: string | null;
  rentalType: RentalType | null;
  totalHousemates: number | null;
  features: RoomFeature[];
  locationTags: LocationTag[];
  coverPhotoUrl: string | null;
  createdAt: string;
};

export type DiscoverCursor = {
  createdAt: string;
  id: string;
};

export type DiscoverResult = {
  rooms: DiscoverRoom[];
  nextCursor: DiscoverCursor | null;
};

export type DiscoverFilters = {
  city?: City;
  minPrice?: number;
  maxPrice?: number;
  houseType?: HouseType;
  furnishing?: Furnishing;
  availableFrom?: string;
  features?: RoomFeature[];
  locationTags?: LocationTag[];
  sort?: string;
};

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

export type ProfilePhoto = {
  id: string;
  userId: string;
  slot: number;
  url: string;
  uploadedAt: string;
};

export type ProfileWithPhotos = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  avatarUrl: string | null;
  gender: string | null;
  birthDate: string | null;
  studyProgram: string | null;
  studyLevel: StudyLevel | null;
  bio: string | null;
  lifestyleTags: string[] | null;
  languages: string[] | null;
  preferredCity: City | null;
  vereniging: string | null;
  institutionDomain: string;
  preferredLocale: string | null;
  createdAt: string;
  photos: ProfilePhoto[];
};

export type UserApplication = {
  id: string;
  roomId: string;
  roomTitle: string;
  roomCity: City;
  roomRentPrice: number;
  roomCoverPhotoUrl: string | null;
  roomPhotoCount: number;
  personalMessage: string | null;
  status: ApplicationStatus;
  appliedAt: string;
  updatedAt: string;
};

export type ApplicationDetail = UserApplication & {
  roomDescription: string | null;
  roomHouseType: HouseType | null;
  roomFurnishing: Furnishing | null;
  roomSizeM2: number | null;
  roomTotalHousemates: number | null;
  roomAvailableFrom: string | null;
  roomFeatures: RoomFeature[];
  roomLocationTags: LocationTag[];
  invitation: UserInvitation | null;
};

export type UserInvitation = {
  invitationId: string;
  status: InvitationStatus;
  respondedAt: string | null;
  eventId: string;
  eventTitle: string;
  eventDate: string;
  timeStart: string;
  timeEnd: string | null;
  location: string | null;
  rsvpDeadline: string | null;
  roomId: string;
  roomTitle: string;
  cancelledAt: string | null;
};

export type OnboardingStatus = {
  emailVerified: boolean;
  hasIdentity: boolean;
  hasAbout: boolean;
  hasBio: boolean;
  hasPersonality: boolean;
  hasLanguages: boolean;
  hasPhotos: boolean;
  hasSecurity: boolean;
  isComplete: boolean;
  currentStep: number;
};

export type ActiveConsent = {
  userId: string;
  purpose: string;
  granted: boolean;
  lastUpdatedAt: string;
};

export type SessionInfo = {
  id: string;
  userAgent: string | null;
  ipAddress: string | null;
  createdAt: string;
  expiresAt: string;
  isCurrent: boolean;
};

// ── My Rooms ────────────────────────────────────────────────

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

export type OwnerHouse = {
  id: string;
  name: string;
  roomCount: number;
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
