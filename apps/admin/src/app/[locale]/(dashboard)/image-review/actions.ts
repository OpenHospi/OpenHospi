"use server";

import { db } from "@openhospi/database";
import {
  adminAuditLog,
  profilePhotos,
  profiles,
  roomPhotos,
  rooms,
} from "@openhospi/database/schema";
import { AdminAction } from "@openhospi/shared/enums";
import { count, desc, eq, gte, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { requireAdmin } from "@/lib/auth/server";

// ── Types ───────────────────────────────────────────────────

export type FlaggedPhoto = {
  id: string;
  type: "profile" | "room";
  url: string;
  slot: number;
  uploadedAt: Date;
  userId: string;
  userName: string;
  roomId: string | null;
  roomTitle: string | null;
};

export type ReviewStats = {
  pendingCount: number;
  reviewedTodayCount: number;
};

// ── Queries ─────────────────────────────────────────────────

export async function getFlaggedPhotos(): Promise<FlaggedPhoto[]> {
  await requireAdmin();

  const profileResults = await db
    .select({
      id: profilePhotos.id,
      url: profilePhotos.url,
      slot: profilePhotos.slot,
      uploadedAt: profilePhotos.uploadedAt,
      userId: profilePhotos.userId,
      firstName: profiles.firstName,
      lastName: profiles.lastName,
    })
    .from(profilePhotos)
    .innerJoin(profiles, eq(profiles.id, profilePhotos.userId))
    .where(eq(profilePhotos.moderationStatus, "pending_review"))
    .orderBy(desc(profilePhotos.uploadedAt));

  const roomResults = await db
    .select({
      id: roomPhotos.id,
      url: roomPhotos.url,
      slot: roomPhotos.slot,
      uploadedAt: roomPhotos.uploadedAt,
      userId: rooms.ownerId,
      firstName: profiles.firstName,
      lastName: profiles.lastName,
      roomId: rooms.id,
      roomTitle: rooms.title,
    })
    .from(roomPhotos)
    .innerJoin(rooms, eq(rooms.id, roomPhotos.roomId))
    .innerJoin(profiles, eq(profiles.id, rooms.ownerId))
    .where(eq(roomPhotos.moderationStatus, "pending_review"))
    .orderBy(desc(roomPhotos.uploadedAt));

  return [
    ...profileResults.map((r) => ({
      id: r.id,
      type: "profile" as const,
      url: r.url,
      slot: r.slot,
      uploadedAt: r.uploadedAt!,
      userId: r.userId,
      userName: `${r.firstName ?? ""} ${r.lastName ?? ""}`.trim() || "Unknown",
      roomId: null,
      roomTitle: null,
    })),
    ...roomResults.map((r) => ({
      id: r.id,
      type: "room" as const,
      url: r.url,
      slot: r.slot,
      uploadedAt: r.uploadedAt!,
      userId: r.userId,
      userName: `${r.firstName ?? ""} ${r.lastName ?? ""}`.trim() || "Unknown",
      roomId: r.roomId,
      roomTitle: r.roomTitle,
    })),
  ].sort((a, b) => b.uploadedAt.getTime() - a.uploadedAt.getTime());
}

export async function getReviewStats(): Promise<ReviewStats> {
  await requireAdmin();

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [[pendingProfile], [pendingRoom], [reviewedToday]] = await Promise.all([
    db
      .select({ count: count() })
      .from(profilePhotos)
      .where(eq(profilePhotos.moderationStatus, "pending_review")),
    db
      .select({ count: count() })
      .from(roomPhotos)
      .where(eq(roomPhotos.moderationStatus, "pending_review")),
    db
      .select({ count: count() })
      .from(adminAuditLog)
      .where(
        and(
          eq(adminAuditLog.action, AdminAction.moderate_photo),
          gte(adminAuditLog.createdAt, today),
        ),
      ),
  ]);

  return {
    pendingCount: (pendingProfile?.count ?? 0) + (pendingRoom?.count ?? 0),
    reviewedTodayCount: reviewedToday?.count ?? 0,
  };
}

// ── Mutations ───────────────────────────────────────────────

export async function approvePhoto(photoId: string, type: "profile" | "room") {
  const session = await requireAdmin();

  const table = type === "profile" ? profilePhotos : roomPhotos;
  await db.update(table).set({ moderationStatus: "approved" }).where(eq(table.id, photoId));

  await db.insert(adminAuditLog).values({
    adminUserId: session.user.id,
    action: AdminAction.moderate_photo,
    targetType: type === "profile" ? "profile_photo" : "room_photo",
    targetId: photoId,
    reason: "approved",
    metadata: {},
  });

  revalidatePath("/image-review");
}

export async function rejectPhoto(photoId: string, type: "profile" | "room") {
  const session = await requireAdmin();

  const table = type === "profile" ? profilePhotos : roomPhotos;
  await db.update(table).set({ moderationStatus: "rejected" }).where(eq(table.id, photoId));

  await db.insert(adminAuditLog).values({
    adminUserId: session.user.id,
    action: AdminAction.moderate_photo,
    targetType: type === "profile" ? "profile_photo" : "room_photo",
    targetId: photoId,
    reason: "rejected",
    metadata: {},
  });

  revalidatePath("/image-review");
}
