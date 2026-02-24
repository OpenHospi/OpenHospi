import { SUPPORTED_LOCALES } from "@openhospi/shared/constants";
import type { MetadataRoute } from "next";

import { pool } from "@/lib/db";
import { getCitiesWithRoomCount } from "@/lib/discover";

export const dynamic = "force-dynamic";

const BASE_URL = "https://openhospi.nl";

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

  // Static pages
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

  // City pages
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

  // Individual room pages (non-vereniging, active, limit 5000)
  const { rows: rooms } = await pool.query(
    `SELECT id FROM rooms
     WHERE status = 'active' AND room_vereniging IS NULL
     ORDER BY created_at DESC
     LIMIT 5000`,
  );

  for (const room of rooms) {
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
