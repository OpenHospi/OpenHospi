"use server";

import { createDrizzleSupabaseClient } from "@/lib/db";
import { applications, reviews } from "@/lib/db/schema";
import type { ReviewData } from "@openhospi/database/validators";
import { reviewSchema } from "@openhospi/database/validators";
import {
  ApplicationStatus,
  HouseMemberRole,
  isReviewPhaseStatus,
  isValidApplicationTransition,
  REVIEW_DECISION_TO_APPLICATION_STATUS,
} from "@openhospi/shared/enums";
import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import {
  requireHousemate,
  requireHousePermission,
  requireNotRestricted,
  requireSession,
} from "@/lib/auth/server";
import { logStatusTransition } from "@/lib/queries/application-history";

export async function markApplicationsSeen(roomId: string) {
  const session = await requireSession();
  const restricted = await requireNotRestricted(session.user.id);
  if (restricted) return restricted;

  await requireHousemate(roomId, session.user.id);

  await createDrizzleSupabaseClient(session.user.id).rls(async (tx) => {
    const sentApps = await tx
      .select({ id: applications.id })
      .from(applications)
      .where(and(eq(applications.roomId, roomId), eq(applications.status, ApplicationStatus.sent)));

    if (sentApps.length === 0) return;

    await tx
      .update(applications)
      .set({ status: ApplicationStatus.seen })
      .where(and(eq(applications.roomId, roomId), eq(applications.status, ApplicationStatus.sent)));

    for (const app of sentApps) {
      await logStatusTransition(
        tx,
        app.id,
        ApplicationStatus.sent,
        ApplicationStatus.seen,
        session.user.id,
      );
    }
  });

  revalidatePath(`/my-rooms/${roomId}`);
  return { success: true };
}

export async function submitReview(roomId: string, applicantUserId: string, data: ReviewData) {
  const session = await requireSession();
  const restricted = await requireNotRestricted(session.user.id);
  if (restricted) return restricted;

  const parsed = reviewSchema.safeParse(data);
  if (!parsed.success) return { error: "invalid_data" as const };

  const role = await requireHousemate(roomId, session.user.id);

  await createDrizzleSupabaseClient(session.user.id).rls(async (tx) => {
    await tx
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

    // Owner's review drives application status during review phase
    if (role === HouseMemberRole.owner) {
      const [app] = await tx
        .select({ id: applications.id, status: applications.status })
        .from(applications)
        .where(and(eq(applications.roomId, roomId), eq(applications.userId, applicantUserId)));

      if (app && isReviewPhaseStatus(app.status as ApplicationStatus)) {
        const targetStatus = REVIEW_DECISION_TO_APPLICATION_STATUS[parsed.data.decision];
        if (app.status !== targetStatus) {
          await tx
            .update(applications)
            .set({ status: targetStatus })
            .where(eq(applications.id, app.id));
          await logStatusTransition(
            tx,
            app.id,
            app.status as ApplicationStatus,
            targetStatus,
            session.user.id,
          );
        }
      }
    }
  });

  revalidatePath(`/my-rooms/${roomId}`);
  return { success: true };
}

export async function updateApplicationStatus(
  roomId: string,
  applicationId: string,
  newStatus: ApplicationStatus,
) {
  const session = await requireSession();
  const restricted = await requireNotRestricted(session.user.id);
  if (restricted) return restricted;

  await requireHousePermission(roomId, session.user.id, "application:decide");

  return createDrizzleSupabaseClient(session.user.id).rls(async (tx) => {
    const [app] = await tx
      .select({ status: applications.status })
      .from(applications)
      .where(and(eq(applications.id, applicationId), eq(applications.roomId, roomId)));
    if (!app) return { error: "not_found" as const };

    const currentStatus = app.status as ApplicationStatus;
    if (!isValidApplicationTransition(currentStatus, newStatus)) {
      return { error: "invalid_transition" as const };
    }

    await tx
      .update(applications)
      .set({ status: newStatus })
      .where(eq(applications.id, applicationId));

    await logStatusTransition(tx, applicationId, currentStatus, newStatus, session.user.id);

    revalidatePath(`/my-rooms/${roomId}`);
    revalidatePath("/applications");
    return { success: true };
  });
}
