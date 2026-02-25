"use server";

import type { ApplicationStatus } from "@openhospi/shared/enums";
import { isValidApplicationTransition } from "@openhospi/shared/enums";
import { revalidatePath } from "next/cache";

import { requireHousemate, requireSession } from "@/lib/auth-server";
import { pool } from "@/lib/db";
import type { ReviewData } from "@/lib/schemas/review";
import { reviewSchema } from "@/lib/schemas/review";

export async function markApplicationsSeen(roomId: string) {
  const session = await requireSession("nl");
  await requireHousemate(roomId, session.user.id);

  await pool.query(
    `UPDATE applications SET status = 'seen', updated_at = NOW()
     WHERE room_id = $1 AND status = 'sent'`,
    [roomId],
  );

  revalidatePath(`/my-rooms/${roomId}`);
  return { success: true };
}

export async function submitReview(roomId: string, applicantUserId: string, data: ReviewData) {
  const session = await requireSession("nl");
  const parsed = reviewSchema.safeParse(data);
  if (!parsed.success) return { error: "invalid_data" };

  await requireHousemate(roomId, session.user.id);

  await pool.query(
    `INSERT INTO reviews (room_id, reviewer_id, applicant_id, decision, notes)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (room_id, reviewer_id, applicant_id)
     DO UPDATE SET decision = EXCLUDED.decision, notes = EXCLUDED.notes, reviewed_at = NOW()`,
    [roomId, session.user.id, applicantUserId, parsed.data.decision, parsed.data.notes || null],
  );

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

  const { rows } = await pool.query(
    "SELECT status FROM applications WHERE id = $1 AND room_id = $2",
    [applicationId, roomId],
  );
  if (rows.length === 0) return { error: "not_found" };

  const currentStatus = rows[0].status as ApplicationStatus;
  if (!isValidApplicationTransition(currentStatus, newStatus)) {
    return { error: "invalid_transition" };
  }

  await pool.query("UPDATE applications SET status = $1, updated_at = NOW() WHERE id = $2", [
    newStatus,
    applicationId,
  ]);

  revalidatePath(`/my-rooms/${roomId}`);
  revalidatePath("/applications");
  return { success: true };
}
