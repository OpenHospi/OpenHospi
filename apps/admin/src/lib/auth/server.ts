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

export async function requireOrgMember() {
  const session = await requireSession();
  if (!session.session.activeOrganizationId) {
    // Try to auto-activate the user's org
    const orgs = await auth.api.listOrganizations({
      headers: await headers(),
    });
    if (orgs && orgs.length > 0) {
      await auth.api.setActiveOrganization({
        headers: await headers(),
        body: { organizationId: orgs[0].id },
      });
      // Re-fetch session with active org
      const updatedSession = await getSession();
      if (updatedSession?.session.activeOrganizationId) {
        return updatedSession;
      }
    }
    const locale = (await getLocale()) as Locale;
    redirect({ href: "/login", locale });
  }
  return session;
}

export async function requireOrgAdmin() {
  const session = await requireOrgMember();
  const member = await auth.api.getActiveMember({
    headers: await headers(),
  });
  if (!member || (member.role !== "owner" && member.role !== "admin")) {
    const locale = (await getLocale()) as Locale;
    redirect({ href: "/", locale });
  }
  return session;
}
