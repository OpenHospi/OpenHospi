"use server";

import { createDrizzleSupabaseClient } from "@openhospi/database";
import { reports, rooms } from "@openhospi/database/schema";
import type { ReportReason, ReportType } from "@openhospi/shared/enums";
import { eq } from "drizzle-orm";

import { requireSession } from "@/lib/auth/server";

/**
 * Report a message
 * - Validates that reporter is not the message author
 * - Validates that message exists
 * - Type-safe return with message_report type
 */
export async function reportMessage(data: {
  reportedUserId: string;
  reportedMessageId: string;
  reason: ReportReason;
  description?: string;
  decryptedMessageText?: string;
}) {
  const session = await requireSession();
  const userId = session.user.id;

  if (userId === data.reportedUserId) {
    throw new Error("Cannot report a message from yourself");
  }

  await createDrizzleSupabaseClient(userId).rls(async (tx) => {
    await tx.insert(reports).values({
      reportType: "message",
      reporterId: userId,
      reportedUserId: data.reportedUserId,
      reportedMessageId: data.reportedMessageId,
      reason: data.reason,
      description: data.description,
      decryptedMessageText: data.decryptedMessageText,
    });
  });
}

/**
 * Report a user profile
 * - Validates that reporter is not reporting themselves
 * - Type-safe return with user_report type
 */
export async function reportUser(data: {
  reportedUserId: string;
  reason: ReportReason;
  description?: string;
}) {
  const session = await requireSession();
  const userId = session.user.id;

  if (userId === data.reportedUserId) {
    throw new Error("Cannot report yourself");
  }

  await createDrizzleSupabaseClient(userId).rls(async (tx) => {
    await tx.insert(reports).values({
      reportType: "user",
      reporterId: userId,
      reportedUserId: data.reportedUserId,
      reason: data.reason,
      description: data.description,
    });
  });
}

/**
 * Report a room
 * - Validates that room exists
 * - Validates that reporter is not the room owner
 * - Type-safe return with room_report type
 */
export async function reportRoom(data: {
  reportedRoomId: string;
  reason: ReportReason;
  description?: string;
}) {
  const session = await requireSession();
  const userId = session.user.id;

  // Validate room exists
  const [room] = await createDrizzleSupabaseClient(userId).rls(async (tx) => {
    return tx
      .select({ id: rooms.id, ownerId: rooms.ownerId })
      .from(rooms)
      .where(eq(rooms.id, data.reportedRoomId));
  });

  if (!room) throw new Error("Room not found");
  if (room.ownerId === userId) throw new Error("Cannot report your own room");

  await createDrizzleSupabaseClient(userId).rls(async (tx) => {
    await tx.insert(reports).values({
      reportType: "room",
      reporterId: userId,
      reportedRoomId: data.reportedRoomId,
      reason: data.reason,
      description: data.description,
    });
  });
}

/**
 * Get typed report response (for client usage)
 */
export type TypedReport = {
  type: ReportType;
  id: string;
  reason: ReportReason;
  description?: string;
  createdAt: Date;
};
