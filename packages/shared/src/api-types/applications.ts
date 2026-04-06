import type { ApplicationStatus, Furnishing, HouseType, LocationTag, RoomFeature } from "../enums";

import type { UserInvitation } from "./invitations";

export type UserApplication = {
  id: string;
  roomId: string;
  roomTitle: string;
  roomCity: string;
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
