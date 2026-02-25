import { db } from "@openhospi/database";
import { rooms } from "@openhospi/database/schema";
import { SUPPORTED_LOCALES } from "@openhospi/shared/constants";
import { and, desc, eq, isNull } from "drizzle-orm";
import type { MetadataRoute } from "next";

import { getCitiesWithRoomCount } from "@/lib/discover";

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

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries: MetadataRoute.Sitemap = [];

  for (const page of staticPages) {
    for (const locale of SUPPORTED_LOCALES) {
      entries.push({
        url: `${BASE_URL}/${locale}${page}`,
        lastModified: new Date(),
        changeFrequency: page === "" ? "weekly" : "monthly",
        priority: page === "" ? 1.0 : 0.8,
        alternates: {
          languages: Object.fromEntries(
            SUPPORTED_LOCALES.map((l) => [l, `${BASE_URL}/${l}${page}`]),
          ),
        },
      });
    }
  }

  const cities = await getCitiesWithRoomCount();
  for (const { city } of cities) {
    for (const locale of SUPPORTED_LOCALES) {
      entries.push({
        url: `${BASE_URL}/${locale}/rooms/${city}`,
        lastModified: new Date(),
        changeFrequency: "daily",
        priority: 0.7,
        alternates: {
          languages: Object.fromEntries(
            SUPPORTED_LOCALES.map((l) => [l, `${BASE_URL}/${l}/rooms/${city}`]),
          ),
        },
      });
    }
  }

  const publicRooms = await db
    .select({ id: rooms.id })
    .from(rooms)
    .where(and(eq(rooms.status, "active"), isNull(rooms.roomVereniging)))
    .orderBy(desc(rooms.createdAt))
    .limit(5000);

  for (const room of publicRooms) {
    for (const locale of SUPPORTED_LOCALES) {
      entries.push({
        url: `${BASE_URL}/${locale}/rooms/${room.id}`,
        lastModified: new Date(),
        changeFrequency: "weekly",
        priority: 0.6,
        alternates: {
          languages: Object.fromEntries(
            SUPPORTED_LOCALES.map((l) => [l, `${BASE_URL}/${l}/rooms/${room.id}`]),
          ),
        },
      });
    }
  }

  return entries;
}
