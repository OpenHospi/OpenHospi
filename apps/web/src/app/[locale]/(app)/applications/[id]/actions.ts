"use server";

import { withRLS } from "@openhospi/database";
import { applications } from "@openhospi/database/schema";
import { ApplicationStatus, isValidApplicationTransition } from "@openhospi/shared/enums";
import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { requireSession } from "@/lib/auth-server";

export async function withdrawApplication(applicationId: string) {
  const session = await requireSession();

  return withRLS(session.user.id, async (tx) => {
    const [app] = await tx
      .select({ roomId: applications.roomId, status: applications.status })
      .from(applications)
      .where(and(eq(applications.id, applicationId), eq(applications.userId, session.user.id)));
    if (!app) return { error: "not_found" as const };

    if (
      !isValidApplicationTransition(app.status as ApplicationStatus, ApplicationStatus.withdrawn)
    ) {
      return { error: "cannot_withdraw" as const };
    }

    await tx
      .update(applications)
      .set({ status: ApplicationStatus.withdrawn })
      .where(eq(applications.id, applicationId));

    revalidatePath(`/applications/${applicationId}`);
    revalidatePath("/applications");
    return { success: true };
  });
}
