import { NextResponse } from "next/server";
import createMiddleware from "next-intl/middleware";

import { appRouting, marketingRouting } from "./i18n/routing";

const marketingMiddleware = createMiddleware(marketingRouting);
const appMiddleware = createMiddleware(appRouting);

const ROOT_DOMAIN = process.env.NEXT_PUBLIC_ROOT_DOMAIN;
const MARKETING_URL = process.env.NEXT_PUBLIC_MARKETING_URL;
const APP_URL = process.env.NEXT_PUBLIC_APP_URL;
const ADMIN_URL = process.env.NEXT_PUBLIC_ADMIN_URL;

type Subdomain = "www" | "app" | "admin";
type RouteType = "app" | "auth" | "admin" | "marketing";

const appPaths = ["/discover", "/profile", "/applications", "/settings", "/my-rooms"];
const authPaths = ["/login", "/onboarding"];
const adminPaths = ["/admin"];

const localePattern = /^\/(?:nl|en|de)(\/|$)/;

function getSubdomain(host: string): Subdomain | null {
  if (!ROOT_DOMAIN) return null;
  const lower = host.split(":")[0].toLowerCase();
  if (lower === ROOT_DOMAIN || lower === `www.${ROOT_DOMAIN}`) return "www";
  if (lower === `app.${ROOT_DOMAIN}`) return "app";
  if (lower === `admin.${ROOT_DOMAIN}`) return "admin";
  return null;
}

function getBarePath(pathname: string): string {
  if (localePattern.test(pathname)) {
    return "/" + pathname.split("/").slice(2).join("/");
  }
  return pathname;
}

function getLocaleFromPath(pathname: string): string | null {
  const match = pathname.match(/^\/(nl|en|de)(\/|$)/);
  return match ? match[1] : null;
}

function matchesPaths(path: string, paths: string[]): boolean {
  return paths.some((p) => path === p || path.startsWith(p + "/"));
}

function classifyBarePath(barePath: string): RouteType {
  if (matchesPaths(barePath, appPaths)) return "app";
  if (matchesPaths(barePath, authPaths)) return "auth";
  if (matchesPaths(barePath, adminPaths)) return "admin";
  return "marketing";
}

function isAppRoute(routeType: RouteType): boolean {
  return routeType === "app" || routeType === "auth" || routeType === "admin";
}

// Maps each subdomain to which route types should redirect, and where
const redirectMap: Record<Subdomain, Partial<Record<RouteType, string | undefined>>> = {
  www: {
    app: APP_URL,
    auth: APP_URL,
    admin: ADMIN_URL,
  },
  app: {
    marketing: MARKETING_URL,
    admin: ADMIN_URL,
  },
  admin: {
    app: APP_URL,
    auth: APP_URL,
    marketing: MARKETING_URL,
  },
};

// Default landing paths for subdomains that shouldn't serve root
const rootRedirects: Partial<Record<Subdomain, string>> = {
  app: "/discover",
  admin: "/admin",
};

function enforceSubdomain(
  subdomain: Subdomain,
  pathname: string,
  requestUrl: string,
): NextResponse | null {
  const barePath = getBarePath(pathname);
  const locale = getLocaleFromPath(pathname);

  // Redirect root path on app/admin subdomains to their landing page
  if ((barePath === "/" || barePath === "") && rootRedirects[subdomain]) {
    return NextResponse.redirect(new URL(rootRedirects[subdomain]!, requestUrl));
  }

  // Redirect mismatched route types to the correct subdomain
  const routeType = classifyBarePath(barePath);
  const targetUrl = redirectMap[subdomain][routeType];
  if (targetUrl) {
    if (isAppRoute(routeType)) {
      // App routes: no locale prefix
      return NextResponse.redirect(new URL(barePath, targetUrl));
    }
    // Marketing routes: keep locale prefix
    const prefixedPath = locale ? `/${locale}${barePath}` : barePath;
    return NextResponse.redirect(new URL(prefixedPath, targetUrl));
  }

  return null;
}

export function proxy(request: Parameters<typeof marketingMiddleware>[0]) {
  const { pathname } = request.nextUrl;
  const host = request.headers.get("host") ?? "";
  const subdomain = getSubdomain(host);

  // Subdomain enforcement (production only)
  if (subdomain) {
    const redirect = enforceSubdomain(subdomain, pathname, request.url);
    if (redirect) return redirect;
  }

  const barePath = getBarePath(pathname);
  const routeType = classifyBarePath(barePath);

  // Auth check: protected app routes require session cookie
  if (routeType === "app" && !request.cookies.get("better-auth.session_token")) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (isAppRoute(routeType)) {
    return appMiddleware(request);
  }

  return marketingMiddleware(request);
}

export const config = {
  // Match all pathnames except:
  // - /api, /trpc, /_next, /_vercel
  // - files with extensions (e.g. favicon.ico, icon.svg)
  // - metadata routes (apple-icon, opengraph-image, sitemap, robots, manifest)
  matcher:
    "/((?!api|trpc|_next|_vercel|apple-icon|opengraph-image|sitemap|robots|manifest|.*\\..*).*)",
};
