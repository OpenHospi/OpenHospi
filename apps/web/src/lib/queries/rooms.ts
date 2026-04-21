import { createDrizzleSupabaseClient } from "@openhospi/database";
import { applications, roomPhotos, rooms } from "@openhospi/database/schema";
import type { Room, RoomPhoto } from "@openhospi/database/types";
import { RoomStatus } from "@openhospi/shared/enums";
import { and, count, desc, eq, inArray } from "drizzle-orm";
import { cache } from "react";

export type { Room, RoomPhoto };

export type RoomWithPhotos = Room & { photos: RoomPhoto[] };

export type RoomSummary = {
  id: string;
  title: string;
  city: string;
  rentPrice: number;
  serviceCosts: number | null;
  totalCost: number;
  status: RoomStatus;
  coverPhotoUrl: string | null;
  applicantCount: number;
  createdAt: Date;
};

export async function getExistingDraft(userId: string, houseId: string): Promise<string | null> {
  return createDrizzleSupabaseClient(userId).rls(async (tx) => {
    const [row] = await tx
      .select({ id: rooms.id })
      .from(rooms)
      .where(
        and(
          eq(rooms.ownerId, userId),
          eq(rooms.houseId, houseId),
          eq(rooms.status, RoomStatus.draft),
        ),
      )
      .limit(1);
    return row?.id ?? null;
  });
}

export async function createDraftRoom(userId: string, houseId: string): Promise<string> {
  const roomId = crypto.randomUUID();

  await createDrizzleSupabaseClient(userId).rls(async (tx) => {
    await tx.insert(rooms).values({
      id: roomId,
      ownerId: userId,
      houseId,
      title: "",
      city: "",
      rentPrice: 0,
      status: RoomStatus.draft,
    });
  });

  return roomId;
}

export const getRoom = cache(async function getRoom(
  roomId: string,
  userId: string,
): Promise<RoomWithPhotos | null> {
  return createDrizzleSupabaseClient(userId).rls(async (tx) => {
    const room = await tx.query.rooms.findFirst({
      where: { id: roomId, ownerId: userId },
      with: { photos: { orderBy: { slot: "asc" } } },
    });
    return room ?? null;
  });
});

export async function getUserRooms(userId: string): Promise<RoomSummary[]> {
  return createDrizzleSupabaseClient(userId).rls(async (tx) => {
    const rows = await tx
      .select({
        id: rooms.id,
        title: rooms.title,
        city: rooms.city,
        rentPrice: rooms.rentPrice,
        serviceCosts: rooms.serviceCosts,
        totalCost: rooms.totalCost,
        status: rooms.status,
        createdAt: rooms.createdAt,
        coverPhotoUrl: roomPhotos.url,
      })
      .from(rooms)
      .leftJoin(roomPhotos, and(eq(roomPhotos.roomId, rooms.id), eq(roomPhotos.slot, 1)))
      .where(eq(rooms.ownerId, userId))
      .orderBy(desc(rooms.createdAt));

    const roomIds = rows.map((r) => r.id);
    const countRows = roomIds.length
      ? await tx
          .select({ roomId: applications.roomId, count: count() })
          .from(applications)
          .where(inArray(applications.roomId, roomIds))
          .groupBy(applications.roomId)
      : [];
    const countMap = new Map(countRows.map((c) => [c.roomId, c.count]));

    return rows.map((r) => ({
      ...r,
      applicantCount: countMap.get(r.id) ?? 0,
    }));
  });
}

export async function getRoomPhotos(roomId: string, userId: string): Promise<RoomPhoto[]> {
  return createDrizzleSupabaseClient(userId).rls((tx) =>
    tx.select().from(roomPhotos).where(eq(roomPhotos.roomId, roomId)).orderBy(roomPhotos.slot),
  );
}
