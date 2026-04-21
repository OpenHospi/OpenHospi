import { createDrizzleSupabaseClient } from "@openhospi/database";
import {
  applications,
  applicationStatusHistory,
  roomPhotos,
  rooms,
} from "@openhospi/database/schema";
import type {
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
import { RoomStatus, ApplicationStatus } from "@openhospi/shared/enums";
import { and, asc, count, desc, eq, sql } from "drizzle-orm";

import { notBlockedBy } from "@/lib/queries/block-filter";

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
  appliedAt: Date;
  updatedAt: Date;
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
};

export type RoomDetailForApply = {
  id: string;
  title: string;
  description: string | null;
  city: string;
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
  createdAt: Date;
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

export async function getUserApplications(userId: string): Promise<UserApplication[]> {
  const photoCountSq =
    sql<string>`(select ${count()} from ${roomPhotos} where ${roomPhotos.roomId} = ${rooms.id})`.as(
      "room_photo_count",
    );

  const rows = await createDrizzleSupabaseClient(userId).rls((tx) =>
    tx
      .select({
        id: applications.id,
        roomId: applications.roomId,
        personalMessage: applications.personalMessage,
        status: applications.status,
        appliedAt: applications.appliedAt,
        updatedAt: applications.updatedAt,
        roomTitle: rooms.title,
        roomCity: rooms.city,
        roomRentPrice: rooms.rentPrice,
        roomCoverPhotoUrl: roomPhotos.url,
        roomPhotoCount: photoCountSq,
      })
      .from(applications)
      .innerJoin(rooms, eq(rooms.id, applications.roomId))
      .leftJoin(roomPhotos, and(eq(roomPhotos.roomId, rooms.id), eq(roomPhotos.slot, 1)))
      .where(and(eq(applications.userId, userId), notBlockedBy(rooms.ownerId, userId)))
      .orderBy(desc(applications.appliedAt)),
  );

  return rows.map((r) => ({
    ...r,
    roomRentPrice: Number(r.roomRentPrice),
    roomPhotoCount: Number(r.roomPhotoCount),
  }));
}

export async function getApplicationDetail(
  applicationId: string,
  userId: string,
): Promise<ApplicationDetail | null> {
  const photoCountSq =
    sql<string>`(select ${count()} from ${roomPhotos} where ${roomPhotos.roomId} = ${rooms.id})`.as(
      "room_photo_count",
    );

  return createDrizzleSupabaseClient(userId).rls(async (tx) => {
    const [row] = await tx
      .select({
        id: applications.id,
        roomId: applications.roomId,
        personalMessage: applications.personalMessage,
        status: applications.status,
        appliedAt: applications.appliedAt,
        updatedAt: applications.updatedAt,
        roomTitle: rooms.title,
        roomCity: rooms.city,
        roomRentPrice: rooms.rentPrice,
        roomDescription: rooms.description,
        roomHouseType: rooms.houseType,
        roomFurnishing: rooms.furnishing,
        roomSizeM2: rooms.roomSizeM2,
        roomTotalHousemates: rooms.totalHousemates,
        roomAvailableFrom: rooms.availableFrom,
        roomFeatures: rooms.features,
        roomLocationTags: rooms.locationTags,
        roomCoverPhotoUrl: roomPhotos.url,
        roomPhotoCount: photoCountSq,
      })
      .from(applications)
      .innerJoin(rooms, eq(rooms.id, applications.roomId))
      .leftJoin(roomPhotos, and(eq(roomPhotos.roomId, rooms.id), eq(roomPhotos.slot, 1)))
      .where(and(eq(applications.id, applicationId), eq(applications.userId, userId)));

    if (!row) return null;

    return {
      ...row,
      roomRentPrice: Number(row.roomRentPrice),
      roomPhotoCount: Number(row.roomPhotoCount),
      roomFeatures: row.roomFeatures ?? [],
      roomLocationTags: row.roomLocationTags ?? [],
    };
  });
}

export async function getApplicationForRoom(
  roomId: string,
  userId: string,
): Promise<{ id: string; status: ApplicationStatus } | null> {
  return createDrizzleSupabaseClient(userId).rls(async (tx) => {
    const row = await tx.query.applications.findFirst({
      columns: { id: true, status: true },
      where: { roomId, userId },
    });
    return row ?? null;
  });
}

export async function getRoomDetailForApply(
  roomId: string,
  userId: string,
): Promise<RoomDetailForApply | null> {
  return createDrizzleSupabaseClient(userId).rls(async (tx) => {
    const userProfile = await tx.query.profiles.findFirst({
      columns: { vereniging: true },
      where: { id: userId },
    });

    const room = await tx.query.rooms.findFirst({
      where: {
        id: roomId,
        status: RoomStatus.active,
        ...(userProfile?.vereniging
          ? ({
              OR: [
                { roomVereniging: { isNull: true as const } },
                { roomVereniging: userProfile.vereniging },
              ],
            } as const)
          : { roomVereniging: { isNull: true as const } }),
      },
      with: {
        photos: {
          columns: { id: true, slot: true, url: true, caption: true },
          orderBy: { slot: "asc" },
        },
        owner: {
          columns: {
            firstName: true,
            lastName: true,
            avatarUrl: true,
            studyProgram: true,
            studyLevel: true,
            institutionDomain: true,
          },
        },
      },
    });

    if (!room) return null;

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
      features: room.features ?? [],
      locationTags: room.locationTags ?? [],
      roomVereniging: room.roomVereniging,
      preferredGender: room.preferredGender,
      preferredAgeMin: room.preferredAgeMin,
      preferredAgeMax: room.preferredAgeMax,
      acceptedLanguages: room.acceptedLanguages ?? [],
      ownerId: room.ownerId,
      createdAt: room.createdAt,
      photos: room.photos,
      owner: room.owner ?? null,
    };
  });
}

export type StatusHistoryEntry = {
  fromStatus: ApplicationStatus | null;
  toStatus: ApplicationStatus;
  changedAt: Date;
};

export async function getApplicationStatusHistory(
  applicationId: string,
  userId: string,
): Promise<StatusHistoryEntry[]> {
  return createDrizzleSupabaseClient(userId).rls(async (tx) => {
    // Verify the user owns this application
    const [app] = await tx
      .select({ id: applications.id })
      .from(applications)
      .where(and(eq(applications.id, applicationId), eq(applications.userId, userId)));
    if (!app) return [];

    return tx
      .select({
        fromStatus: applicationStatusHistory.fromStatus,
        toStatus: applicationStatusHistory.toStatus,
        changedAt: applicationStatusHistory.changedAt,
      })
      .from(applicationStatusHistory)
      .where(eq(applicationStatusHistory.applicationId, applicationId))
      .orderBy(asc(applicationStatusHistory.changedAt));
  });
}
