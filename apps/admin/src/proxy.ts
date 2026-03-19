import { localePathPattern } from "@openhospi/i18n";
import { getSessionCookie } from "better-auth/cookies";
import { NextResponse } from "next/server";
import createMiddleware from "next-intl/middleware";

import { routing } from "./i18n/routing";

const i18nMiddleware = createMiddleware(routing);

const authPaths = ["/login"];

function getBarePath(pathname: string): string {
  if (localePathPattern.test(pathname)) {
    return "/" + pathname.split("/").slice(2).join("/");
  }
  return pathname;
}

function matchesPaths(path: string, paths: string[]): boolean {
  return paths.some((p) => path === p || path.startsWith(p + "/"));
}

export function proxy(request: Parameters<typeof i18nMiddleware>[0]) {
  const { pathname } = request.nextUrl;
  const barePath = getBarePath(pathname);
  const isAuthRoute = matchesPaths(barePath, authPaths);
  const hasSession = !!getSessionCookie(request);

  if (!isAuthRoute && !hasSession) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (isAuthRoute && hasSession) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return i18nMiddleware(request);
}

export const config = {
  matcher: "/((?!api|_next|_vercel|apple-icon|opengraph-image|sitemap|robots|manifest|.*\\..*).*)",
};
