"use server";

import { isValidApplicationTransition } from "@openhospi/shared/enums";
import { revalidatePath } from "next/cache";

import { requireSession } from "@/lib/auth-server";
import { pool } from "@/lib/db";

export async function withdrawApplication(applicationId: string) {
  const session = await requireSession("nl");

  const { rows } = await pool.query(
    "SELECT room_id, status FROM applications WHERE id = $1 AND user_id = $2",
    [applicationId, session.user.id],
  );
  if (rows.length === 0) return { error: "not_found" };

  const { status } = rows[0];
  if (!isValidApplicationTransition(status, "withdrawn")) {
    return { error: "cannot_withdraw" };
  }

  await pool.query(
    "UPDATE applications SET status = 'withdrawn', updated_at = NOW() WHERE id = $1",
    [applicationId],
  );

  revalidatePath(`/applications/${applicationId}`);
  revalidatePath("/applications");
  return { success: true };
}
