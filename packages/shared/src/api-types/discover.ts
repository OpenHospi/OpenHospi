import type { City, Furnishing, HouseType, LocationTag, RentalType, RoomFeature } from "../enums";

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

export type DiscoverCursor = {
  createdAt: string;
  id: string;
};

export type DiscoverResult = {
  rooms: DiscoverRoom[];
  nextCursor: DiscoverCursor | null;
};
