"use server";

import { withRLS } from "@openhospi/database";
import { reports, rooms } from "@openhospi/database/schema";
import type { ReportReason } from "@openhospi/shared/enums";
import { eq } from "drizzle-orm";

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

export async function reportUser(data: {
  reportedUserId: string;
  reason: ReportReason;
  description?: string;
}) {
  const session = await requireSession();
  const userId = session.user.id;

  if (userId === data.reportedUserId) throw new Error("Cannot report yourself");

  await withRLS(userId, async (tx) => {
    await tx.insert(reports).values({
      reporterId: userId,
      reportedUserId: data.reportedUserId,
      reason: data.reason,
      description: data.description,
    });
  });
}

export async function reportRoom(data: {
  reportedRoomId: string;
  reason: ReportReason;
  description?: string;
}) {
  const session = await requireSession();
  const userId = session.user.id;

  // Validate room exists
  const [room] = await withRLS(userId, async (tx) => {
    return tx
      .select({ id: rooms.id, ownerId: rooms.ownerId })
      .from(rooms)
      .where(eq(rooms.id, data.reportedRoomId));
  });

  if (!room) throw new Error("Room not found");
  if (room.ownerId === userId) throw new Error("Cannot report your own room");

  await withRLS(userId, async (tx) => {
    await tx.insert(reports).values({
      reporterId: userId,
      reportedRoomId: data.reportedRoomId,
      reason: data.reason,
      description: data.description,
    });
  });
}
