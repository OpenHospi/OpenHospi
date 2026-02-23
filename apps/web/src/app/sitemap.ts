import { SUPPORTED_LOCALES } from "@openhospi/shared/constants";
import type { MetadataRoute } from "next";

const BASE_URL = "https://openhospi.nl";

const pages = [
  "",
  "/find-a-room",
  "/list-a-room",
  "/safety",
  "/about",
  "/privacy",
  "/terms",
  "/costs",
];

export default function sitemap(): MetadataRoute.Sitemap {
  const entries: MetadataRoute.Sitemap = [];

  for (const page of pages) {
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

  return entries;
}
