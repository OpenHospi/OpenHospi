import { localePathPattern } from "@openhospi/i18n";
import { getSessionCookie } from "better-auth/cookies";
import { NextResponse } from "next/server";
import createMiddleware from "next-intl/middleware";

import { appRouting, marketingRouting } from "./i18n/routing";

const marketingMiddleware = createMiddleware(marketingRouting);
const appMiddleware = createMiddleware(appRouting);

const ROOT_DOMAIN = process.env.NEXT_PUBLIC_ROOT_DOMAIN;
const MARKETING_URL = process.env.NEXT_PUBLIC_MARKETING_URL;
const APP_URL = process.env.NEXT_PUBLIC_APP_URL;

type Subdomain = "www" | "app";
type RouteType = "app" | "auth" | "marketing";

const appPaths = [
  "/discover",
  "/profile",
  "/applications",
  "/settings",
  "/my-rooms",
  "/my-house",
  "/join",
  "/chat",
  "/notifications",
];
const authPaths = ["/login", "/onboarding", "/privacy-accept"];

function getSubdomain(host: string): Subdomain | null {
  if (!ROOT_DOMAIN) return null;
  const lower = host.split(":")[0].toLowerCase();
  if (lower === ROOT_DOMAIN || lower === `www.${ROOT_DOMAIN}`) return "www";
  if (lower === `app.${ROOT_DOMAIN}`) return "app";
  return null;
}

function getBarePath(pathname: string): string {
  if (localePathPattern.test(pathname)) {
    return "/" + pathname.split("/").slice(2).join("/");
  }
  return pathname;
}

function getLocaleFromPath(pathname: string): string | null {
  const match = pathname.match(localePathPattern);
  return match ? match[1] : null;
}

function matchesPaths(path: string, paths: string[]): boolean {
  return paths.some((p) => path === p || path.startsWith(p + "/"));
}

function classifyBarePath(barePath: string): RouteType {
  if (matchesPaths(barePath, appPaths)) return "app";
  if (matchesPaths(barePath, authPaths)) return "auth";
  return "marketing";
}

function isAppRoute(routeType: RouteType): boolean {
  return routeType === "app" || routeType === "auth";
}

const redirectMap: Record<Subdomain, Partial<Record<RouteType, string | undefined>>> = {
  www: {
    app: APP_URL,
    auth: APP_URL,
  },
  app: {
    marketing: MARKETING_URL,
  },
};

function enforceSubdomain(
  subdomain: Subdomain,
  pathname: string,
  requestUrl: string,
): NextResponse | null {
  const barePath = getBarePath(pathname);
  const locale = getLocaleFromPath(pathname);

  // Redirect root on app subdomain to /discover
  if (subdomain === "app" && (barePath === "/" || barePath === "")) {
    return NextResponse.redirect(new URL("/discover", requestUrl));
  }

  // Redirect mismatched route types to the correct subdomain
  const routeType = classifyBarePath(barePath);
  const targetUrl = redirectMap[subdomain][routeType];
  if (targetUrl) {
    if (isAppRoute(routeType)) {
      return NextResponse.redirect(new URL(barePath, targetUrl));
    }
    const prefixedPath = locale ? `/${locale}${barePath}` : barePath;
    return NextResponse.redirect(new URL(prefixedPath, targetUrl));
  }

  return null;
}

export function proxy(request: Parameters<typeof marketingMiddleware>[0]) {
  const { pathname } = request.nextUrl;
  const host = request.headers.get("host") ?? "";

  // MTA-STS subdomain: only allow the policy file, block everything else
  if (ROOT_DOMAIN && host.split(":")[0].toLowerCase() === `mta-sts.${ROOT_DOMAIN}`) {
    if (pathname === "/.well-known/mta-sts.txt") {
      return NextResponse.next();
    }
    return new NextResponse(null, { status: 404 });
  }

  const subdomain = getSubdomain(host);

  if (subdomain) {
    const redirect = enforceSubdomain(subdomain, pathname, request.url);
    if (redirect) return redirect;
  }

  const barePath = getBarePath(pathname);
  const routeType = classifyBarePath(barePath);

  if (routeType === "app" && !getSessionCookie(request)) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (isAppRoute(routeType)) {
    return appMiddleware(request);
  }

  return marketingMiddleware(request);
}

export const config = {
  matcher:
    "/((?!api|trpc|_next|_vercel|apple-icon|opengraph-image|sitemap|robots|manifest|.*\\..*).*)",
};
