"use server";

import { withRLS } from "@openhospi/database";
import { reports } from "@openhospi/database/schema";
import type { ReportReason } from "@openhospi/shared/enums";

import { requireSession } from "@/lib/auth-server";

export async function reportMessage(data: {
  reportedUserId: string;
  reportedMessageId: string;
  reason: ReportReason;
  description?: string;
  decryptedMessageText?: string;
}) {
  const session = await requireSession();
  const userId = session.user.id;

  if (userId === data.reportedUserId) throw new Error("Cannot report yourself");

  await withRLS(userId, async (tx) => {
    await tx.insert(reports).values({
      reporterId: userId,
      reportedUserId: data.reportedUserId,
      reportedMessageId: data.reportedMessageId,
      reason: data.reason,
      description: data.description,
      decryptedMessageText: data.decryptedMessageText,
    });
  });
}
