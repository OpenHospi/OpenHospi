"use server";

import { requireSession } from "@/lib/auth/server";
import { getCalendarTokenForUser } from "@/lib/services/settings-mutations";

export async function getCalendarToken(): Promise<string | null> {
  const session = await requireSession();
  return getCalendarTokenForUser(session.user.id);
}
