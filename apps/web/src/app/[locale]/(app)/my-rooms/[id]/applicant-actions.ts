"use server";

import { db } from "@openhospi/database";
import { applications, reviews } from "@openhospi/database/schema";
import type { ApplicationStatus } from "@openhospi/shared/enums";
import { isValidApplicationTransition } from "@openhospi/shared/enums";
import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { requireHousemate, requireSession } from "@/lib/auth-server";
import type { ReviewData } from "@openhospi/database/validators";
import { reviewSchema } from "@openhospi/database/validators";

export async function markApplicationsSeen(roomId: string) {
  const session = await requireSession("nl");
  await requireHousemate(roomId, session.user.id);

  await db
    .update(applications)
    .set({ status: "seen" })
    .where(and(eq(applications.roomId, roomId), eq(applications.status, "sent")));

  revalidatePath(`/my-rooms/${roomId}`);
  return { success: true };
}

export async function submitReview(roomId: string, applicantUserId: string, data: ReviewData) {
  const session = await requireSession("nl");
  const parsed = reviewSchema.safeParse(data);
  if (!parsed.success) return { error: "invalid_data" };

  await requireHousemate(roomId, session.user.id);

  await db
    .insert(reviews)
    .values({
      roomId,
      reviewerId: session.user.id,
      applicantId: applicantUserId,
      decision: parsed.data.decision,
      notes: parsed.data.notes || null,
    })
    .onConflictDoUpdate({
      target: [reviews.roomId, reviews.reviewerId, reviews.applicantId],
      set: {
        decision: parsed.data.decision,
        notes: parsed.data.notes || null,
        reviewedAt: new Date(),
      },
    });

  revalidatePath(`/my-rooms/${roomId}`);
  return { success: true };
}

export async function updateApplicationStatus(
  roomId: string,
  applicationId: string,
  newStatus: ApplicationStatus,
) {
  const session = await requireSession("nl");
  await requireHousemate(roomId, session.user.id, ["owner", "admin"]);

  const [app] = await db
    .select({ status: applications.status })
    .from(applications)
    .where(and(eq(applications.id, applicationId), eq(applications.roomId, roomId)));
  if (!app) return { error: "not_found" };

  const currentStatus = app.status as ApplicationStatus;
  if (!isValidApplicationTransition(currentStatus, newStatus)) {
    return { error: "invalid_transition" };
  }

  await db
    .update(applications)
    .set({ status: newStatus })
    .where(eq(applications.id, applicationId));

  revalidatePath(`/my-rooms/${roomId}`);
  revalidatePath("/applications");
  return { success: true };
}
