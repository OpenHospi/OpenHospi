import { db } from "@openhospi/database";
import { housemates, roomPhotos, rooms } from "@openhospi/database/schema";
import type { Room, RoomPhoto } from "@openhospi/database/types";
import { eq, sql } from "drizzle-orm";

export type { Room, RoomPhoto };

export type RoomWithPhotos = Room & { photos: RoomPhoto[] };

export type RoomSummary = {
  id: string;
  title: string;
  city: string;
  rentPrice: number;
  status: string;
  coverPhotoUrl: string | null;
  applicantCount: number;
  createdAt: Date;
};

export async function createDraftRoom(userId: string): Promise<string> {
  const roomId = crypto.randomUUID();

  await db.batch([
    db
      .insert(rooms)
      .values({
        id: roomId,
        ownerId: userId,
        title: "",
        city: "amsterdam",
        rentPrice: "0",
        status: "draft",
      })
      .returning(),
    db.insert(housemates).values({
      roomId,
      userId,
      role: "owner",
    }),
  ]);

  return roomId;
}

export async function getRoom(roomId: string, userId: string): Promise<RoomWithPhotos | null> {
  const [room] = await db
    .select()
    .from(rooms)
    .where(sql`${rooms.id} = ${roomId} AND ${rooms.ownerId} = ${userId}`);

  if (!room) return null;

  const photos = await getRoomPhotos(roomId);

  return { ...room, photos };
}

export async function getUserRooms(userId: string): Promise<RoomSummary[]> {
  const rows = await db
    .select({
      id: rooms.id,
      title: rooms.title,
      city: rooms.city,
      rentPrice: rooms.rentPrice,
      status: rooms.status,
      createdAt: rooms.createdAt,
      coverPhotoUrl: sql<string | null>`(SELECT url FROM room_photos WHERE room_id = ${rooms.id} AND slot = 1 LIMIT 1)`,
      applicantCount: sql<number>`(SELECT COUNT(*)::int FROM applications WHERE room_id = ${rooms.id})`,
    })
    .from(rooms)
    .where(eq(rooms.ownerId, userId))
    .orderBy(sql`${rooms.createdAt} DESC`);

  return rows.map((r) => ({
    ...r,
    rentPrice: Number(r.rentPrice),
    applicantCount: Number(r.applicantCount),
  }));
}

export async function getRoomPhotos(roomId: string): Promise<RoomPhoto[]> {
  return db
    .select()
    .from(roomPhotos)
    .where(eq(roomPhotos.roomId, roomId))
    .orderBy(roomPhotos.slot);
}
