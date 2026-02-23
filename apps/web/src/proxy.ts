import createMiddleware from "next-intl/middleware";

import { routing } from "./i18n/routing";

const intlMiddleware = createMiddleware(routing);

export function proxy(request: Parameters<typeof intlMiddleware>[0]) {
  return intlMiddleware(request);
}

export const config = {
  // Match all pathnames except:
  // - /api, /trpc, /_next, /_vercel
  // - files with extensions (e.g. favicon.ico, icon.svg)
  // - metadata routes (apple-icon, opengraph-image, sitemap, robots, manifest)
  matcher:
    "/((?!api|trpc|_next|_vercel|apple-icon|opengraph-image|sitemap|robots|manifest|.*\\..*).*)",
};
