import { createDrizzleSupabaseClient } from "@/lib/db";
import {
  applications,
  applicationStatusHistory,
  profiles,
  roomPhotos,
  rooms,
} from "@/lib/db/schema";
import type {
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
import { RoomStatus, ApplicationStatus } from "@openhospi/shared/enums";
import { and, asc, count, desc, eq, isNull, or, sql } from "drizzle-orm";

import { notBlockedBy } from "@/lib/queries/block-filter";

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
    const [row] = await tx
      .select({ id: applications.id, status: applications.status })
      .from(applications)
      .where(and(eq(applications.roomId, roomId), eq(applications.userId, userId)));
    return row ?? null;
  });
}

export async function getRoomDetailForApply(
  roomId: string,
  userId: string,
): Promise<RoomDetailForApply | null> {
  return createDrizzleSupabaseClient(userId).rls(async (tx) => {
    const [userProfile] = await tx
      .select({ vereniging: profiles.vereniging })
      .from(profiles)
      .where(eq(profiles.id, userId));

    const verenigingCondition = userProfile?.vereniging
      ? or(isNull(rooms.roomVereniging), eq(rooms.roomVereniging, userProfile.vereniging))!
      : isNull(rooms.roomVereniging);

    const [room] = await tx
      .select({
        id: rooms.id,
        title: rooms.title,
        description: rooms.description,
        city: rooms.city,
        neighborhood: rooms.neighborhood,
        streetName: rooms.streetName,
        houseNumber: rooms.houseNumber,
        postalCode: rooms.postalCode,
        latitude: rooms.latitude,
        longitude: rooms.longitude,
        rentPrice: rooms.rentPrice,
        deposit: rooms.deposit,
        utilitiesIncluded: rooms.utilitiesIncluded,
        serviceCosts: rooms.serviceCosts,
        estimatedUtilitiesCosts: rooms.estimatedUtilitiesCosts,
        totalCost: rooms.totalCost,
        roomSizeM2: rooms.roomSizeM2,
        availableFrom: rooms.availableFrom,
        availableUntil: rooms.availableUntil,
        rentalType: rooms.rentalType,
        houseType: rooms.houseType,
        furnishing: rooms.furnishing,
        totalHousemates: rooms.totalHousemates,
        features: rooms.features,
        locationTags: rooms.locationTags,
        roomVereniging: rooms.roomVereniging,
        preferredGender: rooms.preferredGender,
        preferredAgeMin: rooms.preferredAgeMin,
        preferredAgeMax: rooms.preferredAgeMax,

        acceptedLanguages: rooms.acceptedLanguages,
        ownerId: rooms.ownerId,
        createdAt: rooms.createdAt,
      })
      .from(rooms)
      .where(and(eq(rooms.id, roomId), eq(rooms.status, RoomStatus.active), verenigingCondition));

    if (!room) return null;

    const photos = await tx
      .select({
        id: roomPhotos.id,
        slot: roomPhotos.slot,
        url: roomPhotos.url,
        caption: roomPhotos.caption,
      })
      .from(roomPhotos)
      .where(eq(roomPhotos.roomId, roomId))
      .orderBy(roomPhotos.slot);

    const [ownerProfile] = await tx
      .select({
        firstName: profiles.firstName,
        lastName: profiles.lastName,
        avatarUrl: profiles.avatarUrl,
        studyProgram: profiles.studyProgram,
        studyLevel: profiles.studyLevel,
        institutionDomain: profiles.institutionDomain,
      })
      .from(profiles)
      .where(eq(profiles.id, room.ownerId));

    return {
      ...room,
      rentPrice: Number(room.rentPrice),
      deposit: room.deposit ? Number(room.deposit) : null,
      serviceCosts: room.serviceCosts ? Number(room.serviceCosts) : null,
      estimatedUtilitiesCosts: room.estimatedUtilitiesCosts
        ? Number(room.estimatedUtilitiesCosts)
        : null,
      totalCost: Number(room.totalCost),
      features: room.features ?? [],
      locationTags: room.locationTags ?? [],

      acceptedLanguages: room.acceptedLanguages ?? [],
      photos,
      owner: ownerProfile ?? null,
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
