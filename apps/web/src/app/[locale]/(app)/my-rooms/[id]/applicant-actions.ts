"use server";

import type { ApplicationStatus } from "@openhospi/shared/enums";
import type { ReviewData } from "@openhospi/validators";
import { revalidatePath } from "next/cache";

import { requireNotRestricted, requireSession } from "@/lib/auth/server";
import {
  markApplicationsSeenForUser,
  submitReviewForUser,
  updateApplicationStatusForUser,
} from "@/lib/services/applicant-owner-mutations";

export async function markApplicationsSeen(roomId: string) {
  const session = await requireSession();
  const restricted = await requireNotRestricted(session.user.id);
  if (restricted) return restricted;

  const result = await markApplicationsSeenForUser(session.user.id, roomId);
  revalidatePath(`/my-rooms/${roomId}`);
  return result;
}

export async function submitReview(roomId: string, applicantUserId: string, data: ReviewData) {
  const session = await requireSession();
  const restricted = await requireNotRestricted(session.user.id);
  if (restricted) return restricted;

  const result = await submitReviewForUser(session.user.id, roomId, applicantUserId, data);
  revalidatePath(`/my-rooms/${roomId}`);
  return result;
}

export async function updateApplicationStatus(
  roomId: string,
  applicationId: string,
  newStatus: ApplicationStatus,
) {
  const session = await requireSession();
  const restricted = await requireNotRestricted(session.user.id);
  if (restricted) return restricted;

  const result = await updateApplicationStatusForUser(
    session.user.id,
    roomId,
    applicationId,
    newStatus,
  );
  revalidatePath(`/my-rooms/${roomId}`);
  revalidatePath("/applications");
  return result;
}
