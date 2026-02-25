"use server";

import { db } from "@openhospi/database";
import { applications } from "@openhospi/database/schema";
import type { ApplicationStatus } from "@openhospi/shared/enums";
import { isValidApplicationTransition } from "@openhospi/shared/enums";
import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { requireSession } from "@/lib/auth-server";

export async function withdrawApplication(applicationId: string) {
  const session = await requireSession("nl");

  const [app] = await db
    .select({ roomId: applications.roomId, status: applications.status })
    .from(applications)
    .where(and(eq(applications.id, applicationId), eq(applications.userId, session.user.id)));
  if (!app) return { error: "not_found" };

  if (!isValidApplicationTransition(app.status as ApplicationStatus, "withdrawn")) {
    return { error: "cannot_withdraw" };
  }

  await db
    .update(applications)
    .set({ status: "withdrawn" })
    .where(eq(applications.id, applicationId));

  revalidatePath(`/applications/${applicationId}`);
  revalidatePath("/applications");
  return { success: true };
}
