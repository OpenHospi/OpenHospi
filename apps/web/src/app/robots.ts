import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/api/",
          "/*/discover",
          "/*/profile",
          "/*/my-rooms",
          "/*/applications",
          "/*/settings",
          "/*/onboarding",
        ],
      },
    ],
    sitemap: "https://openhospi.nl/sitemap.xml",
  };
}
