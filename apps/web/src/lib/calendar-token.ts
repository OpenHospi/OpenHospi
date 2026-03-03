import { db } from "@openhospi/database";
import { profiles } from "@openhospi/database/schema";
import { eq } from "drizzle-orm";

export async function getUserCalendarToken(userId: string): Promise<string | null> {
  const [row] = await db
    .select({ calendarToken: profiles.calendarToken })
    .from(profiles)
    .where(eq(profiles.id, userId));

  return row?.calendarToken ?? null;
}

export async function regenerateCalendarToken(userId: string): Promise<string> {
  const newToken = crypto.randomUUID();
  await db.update(profiles).set({ calendarToken: newToken }).where(eq(profiles.id, userId));

  return newToken;
}
