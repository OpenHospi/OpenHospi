import { NextResponse } from "next/server";
import createMiddleware from "next-intl/middleware";

import { routing } from "./i18n/routing";

const intlMiddleware = createMiddleware(routing);

const ROOT_DOMAIN = process.env.NEXT_PUBLIC_ROOT_DOMAIN;
const MARKETING_URL = process.env.NEXT_PUBLIC_MARKETING_URL;
const APP_URL = process.env.NEXT_PUBLIC_APP_URL;
const ADMIN_URL = process.env.NEXT_PUBLIC_ADMIN_URL;

type Subdomain = "www" | "app" | "admin";
type RouteType = "app" | "auth" | "admin" | "marketing";

const appPaths = ["/discover", "/profile", "/applications", "/settings", "/my-rooms"];
const authPaths = ["/login", "/onboarding"];
const adminPaths = ["/admin"];

function getSubdomain(host: string): Subdomain | null {
  if (!ROOT_DOMAIN) return null;
  const lower = host.split(":")[0].toLowerCase();
  if (lower === ROOT_DOMAIN || lower === `www.${ROOT_DOMAIN}`) return "www";
  if (lower === `app.${ROOT_DOMAIN}`) return "app";
  if (lower === `admin.${ROOT_DOMAIN}`) return "admin";
  return null;
}

function stripLocalePrefix(pathname: string): string {
  return "/" + pathname.split("/").slice(2).join("/");
}

function getLocaleFromPath(pathname: string): string {
  return pathname.split("/")[1] || routing.defaultLocale;
}

function matchesPaths(path: string, paths: string[]): boolean {
  return paths.some((p) => path === p || path.startsWith(p + "/"));
}

function classifyPath(pathname: string): RouteType {
  const path = stripLocalePrefix(pathname);
  if (matchesPaths(path, appPaths)) return "app";
  if (matchesPaths(path, authPaths)) return "auth";
  if (matchesPaths(path, adminPaths)) return "admin";
  return "marketing";
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
  const locale = getLocaleFromPath(pathname);
  const path = stripLocalePrefix(pathname);

  // Redirect root path on app/admin subdomains to their landing page
  if ((path === "/" || path === "") && rootRedirects[subdomain]) {
    return NextResponse.redirect(new URL(`/${locale}${rootRedirects[subdomain]}`, requestUrl));
  }

  // Redirect mismatched route types to the correct subdomain
  const routeType = classifyPath(pathname);
  const targetUrl = redirectMap[subdomain][routeType];
  if (targetUrl) {
    return NextResponse.redirect(new URL(`/${locale}${path}`, targetUrl));
  }

  return null;
}

export function proxy(request: Parameters<typeof intlMiddleware>[0]) {
  const { pathname } = request.nextUrl;
  const host = request.headers.get("host") ?? "";
  const subdomain = getSubdomain(host);

  // Subdomain enforcement (production only)
  if (subdomain) {
    const redirect = enforceSubdomain(subdomain, pathname, request.url);
    if (redirect) return redirect;
  }

  // Auth check: protected routes require session cookie
  if (classifyPath(pathname) === "app" && !request.cookies.get("better-auth.session_token")) {
    const locale = getLocaleFromPath(pathname);
    return NextResponse.redirect(new URL(`/${locale}/login`, request.url));
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
