import { NextResponse } from "next/server";
import createMiddleware from "next-intl/middleware";

import { routing } from "./i18n/routing";

const intlMiddleware = createMiddleware(routing);

// Routes that require authentication (paths after the locale prefix)
const protectedPaths = ["/discover", "/profile", "/applications", "/settings", "/my-rooms"];

function isProtectedPath(pathname: string): boolean {
  // Strip the locale prefix (e.g., /nl/discover → /discover)
  const segments = pathname.split("/");
  const pathWithoutLocale = "/" + segments.slice(2).join("/");
  return protectedPaths.some(
    (p) => pathWithoutLocale === p || pathWithoutLocale.startsWith(p + "/"),
  );
}

function getLocaleFromPath(pathname: string): string {
  const segments = pathname.split("/");
  return segments[1] || routing.defaultLocale;
}

export function proxy(request: Parameters<typeof intlMiddleware>[0]) {
  const { pathname } = request.nextUrl;

  // Optimistic auth check: redirect to login if no session cookie on protected routes
  if (isProtectedPath(pathname) && !request.cookies.get("better-auth.session_token")) {
    const locale = getLocaleFromPath(pathname);
    const loginUrl = new URL(`/${locale}/login`, request.url);
    return NextResponse.redirect(loginUrl);
  }

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
