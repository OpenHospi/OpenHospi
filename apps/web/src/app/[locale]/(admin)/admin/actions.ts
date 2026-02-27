"use server";

import {db} from "@openhospi/database";
import {
    adminAuditLog,
    profiles,
    reports,
    rooms,
    session,
    user,
} from "@openhospi/database/schema";
import {AdminAction, ReportStatus, RoomStatus} from "@openhospi/shared/enums";
import type {AdminAction as AdminActionType, ReportStatus as ReportStatusType} from "@openhospi/shared/enums";
import {and, count, desc, eq, gte} from "drizzle-orm";
import {revalidatePath} from "next/cache";

import {auth} from "@/lib/auth";
import {requireAdmin} from "@/lib/auth-server";

export type AggregateStats = {
    totalUsers: number;
    activeUsers7d: number;
    activeUsers30d: number;
    newSignupsWeek: number;
    activeListings: number;
    pendingReports: number;
    listingsByCity: { city: string; count: number }[];
};

export async function getAggregateStats(): Promise<AggregateStats> {
    await requireAdmin();

    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [
        [totalUsersRow],
        [activeUsers7dRow],
        [activeUsers30dRow],
        [newSignupsWeekRow],
        [activeListingsRow],
        [pendingReportsRow],
        listingsByCity,
    ] = await Promise.all([
        db.select({count: count()}).from(user),
        db
            .select({count: count()})
            .from(session)
            .where(gte(session.updatedAt, sevenDaysAgo)),
        db
            .select({count: count()})
            .from(session)
            .where(gte(session.updatedAt, thirtyDaysAgo)),
        db
            .select({count: count()})
            .from(user)
            .where(gte(user.createdAt, sevenDaysAgo)),
        db
            .select({count: count()})
            .from(rooms)
            .where(eq(rooms.status, RoomStatus.active)),
        db
            .select({count: count()})
            .from(reports)
            .where(eq(reports.status, ReportStatus.pending)),
        db
            .select({city: rooms.city, count: count()})
            .from(rooms)
            .where(eq(rooms.status, RoomStatus.active))
            .groupBy(rooms.city)
            .orderBy(desc(count())),
    ]);

    return {
        totalUsers: totalUsersRow?.count ?? 0,
        activeUsers7d: activeUsers7dRow?.count ?? 0,
        activeUsers30d: activeUsers30dRow?.count ?? 0,
        newSignupsWeek: newSignupsWeekRow?.count ?? 0,
        activeListings: activeListingsRow?.count ?? 0,
        pendingReports: pendingReportsRow?.count ?? 0,
        listingsByCity,
    };
}

export type ReportListItem = {
    id: string;
    reporterId: string;
    reporterName: string;
    reportedUserId: string | null;
    reportedUserName: string | null;
    reportedRoomId: string | null;
    reportedMessageId: string | null;
    reason: string;
    description: string | null;
    status: string;
    createdAt: Date;
};

export async function getReports(status?: ReportStatusType): Promise<ReportListItem[]> {
    await requireAdmin();

    const conditions = status ? [eq(reports.status, status)] : [];

    // Use aliased profiles for reporter and reported user
    const reporterProfile = profiles;

    const rows = await db
        .select({
            id: reports.id,
            reporterId: reports.reporterId,
            reporterName: reporterProfile.firstName,
            reportedUserId: reports.reportedUserId,
            reportedRoomId: reports.reportedRoomId,
            reportedMessageId: reports.reportedMessageId,
            reason: reports.reason,
            description: reports.description,
            status: reports.status,
            createdAt: reports.createdAt,
        })
        .from(reports)
        .leftJoin(reporterProfile, eq(reporterProfile.id, reports.reporterId))
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .orderBy(desc(reports.createdAt));

    return rows.map((r) => ({
        ...r,
        reporterName: r.reporterName ?? "Unknown",
        reportedUserName: null,
    }));
}

export type ReportDetail = ReportListItem & {
    decryptedMessageText: string | null;
    resolvedAt: Date | null;
    resolvedBy: string | null;
    reportedUserBanned: boolean | null;
};

export async function getReportDetail(reportId: string): Promise<ReportDetail | null> {
    await requireAdmin();

    const [row] = await db
        .select({
            id: reports.id,
            reporterId: reports.reporterId,
            reporterName: profiles.firstName,
            reportedUserId: reports.reportedUserId,
            reportedRoomId: reports.reportedRoomId,
            reportedMessageId: reports.reportedMessageId,
            reason: reports.reason,
            description: reports.description,
            decryptedMessageText: reports.decryptedMessageText,
            status: reports.status,
            createdAt: reports.createdAt,
            resolvedAt: reports.resolvedAt,
            resolvedBy: reports.resolvedBy,
        })
        .from(reports)
        .leftJoin(profiles, eq(profiles.id, reports.reporterId))
        .where(eq(reports.id, reportId));

    if (!row) return null;

    // Check if reported user is banned
    let reportedUserBanned: boolean | null = null;
    let reportedUserName: string | null = null;
    if (row.reportedUserId) {
        const [reportedUser] = await db
            .select({banned: user.banned, name: user.name})
            .from(user)
            .where(eq(user.id, row.reportedUserId));
        reportedUserBanned = reportedUser?.banned ?? null;
        reportedUserName = reportedUser?.name ?? null;
    }

    return {
        ...row,
        reporterName: row.reporterName ?? "Unknown",
        reportedUserName,
        reportedUserBanned,
    };
}

export async function resolveReport(
    reportId: string,
    action: AdminActionType,
    reason: string,
) {
    const adminSession = await requireAdmin();
    const adminUserId = adminSession.user.id;

    await db
        .update(reports)
        .set({
            status: ReportStatus.resolved,
            resolvedAt: new Date(),
            resolvedBy: adminUserId,
        })
        .where(eq(reports.id, reportId));

    await db.insert(adminAuditLog).values({
        adminUserId,
        action,
        targetType: "report",
        targetId: reportId,
        reason,
        metadata: {},
    });

    revalidatePath("/admin/reports");
}

export async function dismissReport(reportId: string, reason: string) {
    const adminSession = await requireAdmin();
    const adminUserId = adminSession.user.id;

    await db
        .update(reports)
        .set({
            status: ReportStatus.dismissed,
            resolvedAt: new Date(),
            resolvedBy: adminUserId,
        })
        .where(eq(reports.id, reportId));

    await db.insert(adminAuditLog).values({
        adminUserId,
        action: AdminAction.dismiss_report,
        targetType: "report",
        targetId: reportId,
        reason,
        metadata: {},
    });

    revalidatePath("/admin/reports");
}

export async function banUser(reportId: string, userId: string, reason: string) {
    const adminSession = await requireAdmin();
    const adminUserId = adminSession.user.id;

    // Ban via Better Auth admin API
    await auth.api.banUser({
        body: {userId, banReason: reason},
    });

    // Resolve the report
    await db
        .update(reports)
        .set({
            status: ReportStatus.resolved,
            resolvedAt: new Date(),
            resolvedBy: adminUserId,
        })
        .where(eq(reports.id, reportId));

    await db.insert(adminAuditLog).values({
        adminUserId,
        action: AdminAction.suspend_user,
        targetType: "user",
        targetId: userId,
        reason,
        metadata: {reportId},
    });

    revalidatePath("/admin/reports");
}

export async function unbanUser(userId: string, reason: string) {
    const adminSession = await requireAdmin();
    const adminUserId = adminSession.user.id;

    await auth.api.unbanUser({
        body: {userId},
    });

    await db.insert(adminAuditLog).values({
        adminUserId,
        action: AdminAction.unsuspend_user,
        targetType: "user",
        targetId: userId,
        reason,
        metadata: {},
    });

    revalidatePath("/admin/reports");
}

export async function removeListing(reportId: string, roomId: string, reason: string) {
    const adminSession = await requireAdmin();
    const adminUserId = adminSession.user.id;

    await db
        .update(rooms)
        .set({status: RoomStatus.closed})
        .where(eq(rooms.id, roomId));

    await db
        .update(reports)
        .set({
            status: ReportStatus.resolved,
            resolvedAt: new Date(),
            resolvedBy: adminUserId,
        })
        .where(eq(reports.id, reportId));

    await db.insert(adminAuditLog).values({
        adminUserId,
        action: AdminAction.remove_listing,
        targetType: "room",
        targetId: roomId,
        reason,
        metadata: {reportId},
    });

    revalidatePath("/admin/reports");
}

export type AuditLogEntry = {
    id: string;
    adminUserId: string;
    adminName: string;
    action: string;
    targetType: string | null;
    targetId: string | null;
    reason: string;
    metadata: unknown;
    createdAt: Date;
};

export async function getAuditLog(
    page: number = 1,
    pageSize: number = 25,
): Promise<{ entries: AuditLogEntry[]; total: number }> {
    await requireAdmin();

    const [totalRow] = await db.select({count: count()}).from(adminAuditLog);
    const total = totalRow?.count ?? 0;

    const entries = await db
        .select({
            id: adminAuditLog.id,
            adminUserId: adminAuditLog.adminUserId,
            adminName: user.name,
            action: adminAuditLog.action,
            targetType: adminAuditLog.targetType,
            targetId: adminAuditLog.targetId,
            reason: adminAuditLog.reason,
            metadata: adminAuditLog.metadata,
            createdAt: adminAuditLog.createdAt,
        })
        .from(adminAuditLog)
        .leftJoin(user, eq(user.id, adminAuditLog.adminUserId))
        .orderBy(desc(adminAuditLog.createdAt))
        .limit(pageSize)
        .offset((page - 1) * pageSize);

    return {
        entries: entries.map((e) => ({
            ...e,
            adminName: e.adminName ?? "Unknown",
        })),
        total,
    };
}
