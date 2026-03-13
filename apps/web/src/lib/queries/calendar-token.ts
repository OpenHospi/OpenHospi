"use server";

import { db } from "@/lib/db";
import { calendarTokens } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

import { requireSession } from "@/lib/auth/server";

export async function getCalendarToken(): Promise<string | null> {
  const session = await requireSession();
  const [row] = await db
    .select({ token: calendarTokens.token })
    .from(calendarTokens)
    .where(eq(calendarTokens.userId, session.user.id));

  if (row) return row.token;

  // Auto-create token on first access
  const [created] = await db
    .insert(calendarTokens)
    .values({ userId: session.user.id })
    .onConflictDoNothing()
    .returning({ token: calendarTokens.token });

  return created?.token ?? null;
}
