import type { Locale } from "@openhospi/i18n";
import { headers } from "next/headers";
import { getLocale } from "next-intl/server";

import { redirect } from "@/i18n/navigation";

import { auth } from "./auth";

export async function getSession() {
  return auth.api.getSession({ headers: await headers() });
}

export async function requireSession() {
  const session = await getSession();
  if (!session) {
    const locale = (await getLocale()) as Locale;
    return redirect({ href: "/login", locale });
  }
  return session;
}

export async function requireAdmin() {
  const session = await requireSession();
  const userWithRole = session.user as typeof session.user & { role?: string };
  if (userWithRole.role !== "admin") {
    const locale = (await getLocale()) as Locale;
    redirect({ href: "/login", locale });
  }
  return session;
}
