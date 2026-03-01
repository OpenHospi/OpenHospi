import { db } from "@openhospi/database";
import { roomPhotos, rooms } from "@openhospi/database/schema";
import { SUPPORTED_LOCALES } from "@openhospi/shared/constants";
import { RoomStatus } from "@openhospi/shared/enums";
import { and, asc, desc, eq, isNull } from "drizzle-orm";
import type { MetadataRoute } from "next";

import { getCitiesWithRoomCount } from "@/lib/discover";
import { getStoragePublicUrl } from "@/lib/storage-url";

export const dynamic = "force-dynamic";

const BASE_URL = process.env.NEXT_PUBLIC_MARKETING_URL ?? "https://openhospi.nl";

const staticPages = [
  "",
  "/find-a-room",
  "/list-a-room",
  "/safety",
  "/about",
  "/privacy",
  "/terms",
  "/costs",
  "/rooms",
];

function localizedEntry(
  path: string,
  opts: {
    changeFrequency: MetadataRoute.Sitemap[0]["changeFrequency"];
    priority: number;
    images?: string[];
  },
): MetadataRoute.Sitemap {
  return SUPPORTED_LOCALES.map((locale) => ({
    url: `${BASE_URL}/${locale}${path}`,
    lastModified: new Date(),
    changeFrequency: opts.changeFrequency,
    priority: opts.priority,
    alternates: {
      languages: Object.fromEntries(SUPPORTED_LOCALES.map((l) => [l, `${BASE_URL}/${l}${path}`])),
    },
    ...(opts.images && opts.images.length > 0 && { images: opts.images }),
  }));
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries: MetadataRoute.Sitemap = staticPages.flatMap((page) =>
    localizedEntry(page, {
      changeFrequency: page === "" ? "weekly" : "monthly",
      priority: page === "" ? 1.0 : 0.8,
    }),
  );

  const cities = await getCitiesWithRoomCount();
  for (const { city } of cities) {
    entries.push(...localizedEntry(`/rooms/${city}`, { changeFrequency: "daily", priority: 0.7 }));
  }

  const publicRooms = await db
    .select({ id: rooms.id })
    .from(rooms)
    .where(and(eq(rooms.status, RoomStatus.active), isNull(rooms.roomVereniging)))
    .orderBy(desc(rooms.createdAt))
    .limit(5000);

  // Fetch photos for all public rooms in one query
  const allPhotos =
    publicRooms.length > 0
      ? await db
          .select({ roomId: roomPhotos.roomId, url: roomPhotos.url })
          .from(roomPhotos)
          .innerJoin(rooms, eq(roomPhotos.roomId, rooms.id))
          .where(and(eq(rooms.status, RoomStatus.active), isNull(rooms.roomVereniging)))
          .orderBy(asc(roomPhotos.slot))
      : [];

  const photosByRoom = new Map<string, string[]>();
  for (const photo of allPhotos) {
    const existing = photosByRoom.get(photo.roomId) ?? [];
    existing.push(getStoragePublicUrl(photo.url, "room-photos"));
    photosByRoom.set(photo.roomId, existing);
  }

  for (const room of publicRooms) {
    entries.push(
      ...localizedEntry(`/rooms/${room.id}`, {
        changeFrequency: "weekly",
        priority: 0.6,
        images: photosByRoom.get(room.id),
      }),
    );
  }

  return entries;
}
