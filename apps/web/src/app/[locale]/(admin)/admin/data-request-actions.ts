"use server";

import { db } from "@/lib/db";
import { adminAuditLog, dataRequests, processingRestrictions, profiles } from "@/lib/db/schema";
import { AdminAction, type DataRequestStatus, type DataRequestType } from "@openhospi/shared/enums";
import { and, count, desc, eq, isNull } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { requireAdmin } from "@/lib/auth/server";

export type DataRequestListItem = {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  type: DataRequestType;
  status: DataRequestStatus;
  description: string | null;
  createdAt: Date;
};

export async function getDataRequests(status?: DataRequestStatus): Promise<DataRequestListItem[]> {
  await requireAdmin();

  const conditions = [];
  if (status) conditions.push(eq(dataRequests.status, status));

  const rows = await db
    .select({
      id: dataRequests.id,
      userId: dataRequests.userId,
      userName: profiles.firstName,
      userEmail: profiles.email,
      type: dataRequests.type,
      status: dataRequests.status,
      description: dataRequests.description,
      createdAt: dataRequests.createdAt,
    })
    .from(dataRequests)
    .leftJoin(profiles, eq(profiles.id, dataRequests.userId))
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(dataRequests.createdAt));

  return rows.map((r) => ({
    ...r,
    userName: r.userName ?? "Unknown",
    userEmail: r.userEmail ?? "",
  }));
}

export async function getDataRequestDetail(requestId: string) {
  await requireAdmin();

  const [row] = await db
    .select({
      id: dataRequests.id,
      userId: dataRequests.userId,
      userName: profiles.firstName,
      userEmail: profiles.email,
      type: dataRequests.type,
      status: dataRequests.status,
      description: dataRequests.description,
      adminNotes: dataRequests.adminNotes,
      createdAt: dataRequests.createdAt,
      completedAt: dataRequests.completedAt,
      completedBy: dataRequests.completedBy,
    })
    .from(dataRequests)
    .leftJoin(profiles, eq(profiles.id, dataRequests.userId))
    .where(eq(dataRequests.id, requestId));

  if (!row) return null;

  return {
    ...row,
    userName: row.userName ?? "Unknown",
    userEmail: row.userEmail ?? "",
  };
}

export async function updateDataRequestStatus(
  requestId: string,
  newStatus: DataRequestStatus,
  notes?: string,
) {
  const adminSession = await requireAdmin();
  const adminUserId = adminSession.user.id;

  const updateData: Record<string, unknown> = { status: newStatus };
  if (notes) updateData.adminNotes = notes;
  if (newStatus === "completed" || newStatus === "denied") {
    updateData.completedAt = new Date();
    updateData.completedBy = adminUserId;
  }

  await db.update(dataRequests).set(updateData).where(eq(dataRequests.id, requestId));

  await db.insert(adminAuditLog).values({
    adminUserId,
    action: AdminAction.process_data_request,
    targetType: "data_request",
    targetId: requestId,
    reason: notes || `Status changed to ${newStatus}`,
    metadata: { newStatus },
  });

  revalidatePath("/admin/data-requests");
  revalidatePath(`/admin/data-requests/${requestId}`);
}

export async function liftUserRestriction(userId: string, reason: string) {
  const adminSession = await requireAdmin();
  const adminUserId = adminSession.user.id;

  await db
    .update(processingRestrictions)
    .set({ liftedAt: new Date(), liftedBy: adminUserId })
    .where(and(eq(processingRestrictions.userId, userId), isNull(processingRestrictions.liftedAt)));

  await db.insert(adminAuditLog).values({
    adminUserId,
    action: AdminAction.lift_restriction,
    targetType: "user",
    targetId: userId,
    reason,
    metadata: {},
  });

  revalidatePath("/admin/data-requests");
}

export async function getDataRequestStats() {
  await requireAdmin();

  const [pendingRow] = await db
    .select({ count: count() })
    .from(dataRequests)
    .where(eq(dataRequests.status, "pending"));

  const [inProgressRow] = await db
    .select({ count: count() })
    .from(dataRequests)
    .where(eq(dataRequests.status, "in_progress"));

  return {
    pending: pendingRow?.count ?? 0,
    inProgress: inProgressRow?.count ?? 0,
  };
}
