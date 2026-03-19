import type { MetadataRoute } from "next";
import { headers } from "next/headers";

const ROOT_DOMAIN = process.env.NEXT_PUBLIC_ROOT_DOMAIN;
const MARKETING_URL = process.env.NEXT_PUBLIC_MARKETING_URL ?? "https://openhospi.nl";

export default async function robots(): Promise<MetadataRoute.Robots> {
  // On app subdomain, disallow everything
  if (ROOT_DOMAIN) {
    const host = (await headers()).get("host")?.split(":")[0]?.toLowerCase() ?? "";
    if (host === `app.${ROOT_DOMAIN}`) {
      return {
        rules: [{ userAgent: "*", disallow: "/" }],
      };
    }
  }

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
          "/*/login",
        ],
      },
    ],
    sitemap: `${MARKETING_URL}/sitemap.xml`,
  };
}
