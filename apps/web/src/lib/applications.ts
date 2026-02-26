import { withRLS } from "@openhospi/database";
import { applications, roomPhotos, rooms } from "@openhospi/database/schema";
import type { ApplicationStatus } from "@openhospi/shared/enums";
import { and, desc, eq, sql } from "drizzle-orm";

export type UserApplication = {
  id: string;
  roomId: string;
  roomTitle: string;
  roomCity: string;
  roomRentPrice: number;
  roomCoverPhotoUrl: string | null;
  personalMessage: string | null;
  status: ApplicationStatus;
  appliedAt: Date;
  updatedAt: Date;
};

export type ApplicationDetail = UserApplication & {
  roomDescription: string | null;
  roomHouseType: string | null;
  roomFurnishing: string | null;
  roomSizeM2: number | null;
  roomTotalHousemates: number | null;
  roomAvailableFrom: string | null;
  roomFeatures: string[];
  roomLocationTags: string[];
};

export type RoomDetailForApply = {
  id: string;
  title: string;
  description: string | null;
  city: string;
  neighborhood: string | null;
  address: string | null;
  rentPrice: number;
  deposit: number | null;
  utilitiesIncluded: boolean | null;
  roomSizeM2: number | null;
  availableFrom: string | null;
  availableUntil: string | null;
  rentalType: string | null;
  houseType: string | null;
  furnishing: string | null;
  totalHousemates: number | null;
  features: string[];
  locationTags: string[];
  roomVereniging: string | null;
  preferredGender: string | null;
  preferredAgeMin: number | null;
  preferredAgeMax: number | null;
  preferredLifestyleTags: string[];
  ownerId: string;
  createdAt: Date;
  photos: { id: string; slot: number; url: string; caption: string | null }[];
};

export async function getUserApplications(userId: string): Promise<UserApplication[]> {
  const rows = await withRLS(userId, (tx) =>
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
        roomCoverPhotoUrl: sql<string | null>`(SELECT url FROM room_photos WHERE room_id = ${rooms.id} AND slot = 1 LIMIT 1)`,
      })
      .from(applications)
      .innerJoin(rooms, eq(rooms.id, applications.roomId))
      .where(eq(applications.userId, userId))
      .orderBy(desc(applications.appliedAt)),
  );

  return rows.map((r) => ({
    ...r,
    roomRentPrice: Number(r.roomRentPrice),
  }));
}

export async function getApplicationDetail(
  applicationId: string,
  userId: string,
): Promise<ApplicationDetail | null> {
  return withRLS(userId, async (tx) => {
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
        roomCoverPhotoUrl: sql<string | null>`(SELECT url FROM room_photos WHERE room_id = ${rooms.id} AND slot = 1 LIMIT 1)`,
      })
      .from(applications)
      .innerJoin(rooms, eq(rooms.id, applications.roomId))
      .where(and(eq(applications.id, applicationId), eq(applications.userId, userId)));

    if (!row) return null;

    return {
      ...row,
      roomRentPrice: Number(row.roomRentPrice),
      roomFeatures: row.roomFeatures ?? [],
      roomLocationTags: row.roomLocationTags ?? [],
    };
  });
}

export async function getApplicationForRoom(
  roomId: string,
  userId: string,
): Promise<{ id: string; status: ApplicationStatus } | null> {
  return withRLS(userId, async (tx) => {
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
  return withRLS(userId, async (tx) => {
    const [room] = await tx
      .select({
        id: rooms.id,
        title: rooms.title,
        description: rooms.description,
        city: rooms.city,
        neighborhood: rooms.neighborhood,
        address: rooms.address,
        rentPrice: rooms.rentPrice,
        deposit: rooms.deposit,
        utilitiesIncluded: rooms.utilitiesIncluded,
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
        preferredLifestyleTags: rooms.preferredLifestyleTags,
        ownerId: rooms.ownerId,
        createdAt: rooms.createdAt,
      })
      .from(rooms)
      .where(
        and(
          eq(rooms.id, roomId),
          eq(rooms.status, "active"),
          sql`(${rooms.roomVereniging} IS NULL OR ${rooms.roomVereniging} = (SELECT vereniging FROM profiles WHERE id = ${userId}))`,
        ),
      );

    if (!room) return null;

    const photos = await tx
      .select({ id: roomPhotos.id, slot: roomPhotos.slot, url: roomPhotos.url, caption: roomPhotos.caption })
      .from(roomPhotos)
      .where(eq(roomPhotos.roomId, roomId))
      .orderBy(roomPhotos.slot);

    return {
      ...room,
      rentPrice: Number(room.rentPrice),
      deposit: room.deposit ? Number(room.deposit) : null,
      features: room.features ?? [],
      locationTags: room.locationTags ?? [],
      preferredLifestyleTags: room.preferredLifestyleTags ?? [],
      photos,
    };
  });
}
