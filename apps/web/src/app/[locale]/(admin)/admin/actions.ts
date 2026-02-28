"use server";

import {db} from "@openhospi/database";
import {
    adminAuditLog,
    profilePhotos,
    profiles,
    reports,
    roomPhotos,
    rooms,
    session,
    user,
} from "@openhospi/database/schema";
import {AdminAction, ReportStatus, RoomStatus} from "@openhospi/shared/enums";
import type {
    AdminAction as AdminActionType,
    ReportStatus as ReportStatusType,
    ReportType as ReportTypeType
} from "@openhospi/shared/enums";
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
    pendingReportsByType: Record<ReportTypeType, number>;
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
        pendingByTypeRows,
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
            .select({type: reports.reportType, count: count()})
            .from(reports)
            .where(eq(reports.status, ReportStatus.pending))
            .groupBy(reports.reportType),
        db
            .select({city: rooms.city, count: count()})
            .from(rooms)
            .where(eq(rooms.status, RoomStatus.active))
            .groupBy(rooms.city)
            .orderBy(desc(count())),
    ]);

    const pendingReportsByType: Record<ReportTypeType, number> = {
        message: 0,
        user: 0,
        room: 0,
    };

    pendingByTypeRows.forEach((row) => {
        pendingReportsByType[row.type as ReportTypeType] = row.count;
    });

    return {
        totalUsers: totalUsersRow?.count ?? 0,
        activeUsers7d: activeUsers7dRow?.count ?? 0,
        activeUsers30d: activeUsers30dRow?.count ?? 0,
        newSignupsWeek: newSignupsWeekRow?.count ?? 0,
        activeListings: activeListingsRow?.count ?? 0,
        pendingReports: pendingReportsRow?.count ?? 0,
        pendingReportsByType,
        listingsByCity,
    };
}

export type ReportListItem = {
    id: string;
    reportType: ReportTypeType;
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

export async function getReports(
    status?: ReportStatusType,
    type?: ReportTypeType,
): Promise<ReportListItem[]> {
    await requireAdmin();

    const conditions = [];
    if (status) conditions.push(eq(reports.status, status));
    if (type) conditions.push(eq(reports.reportType, type));

    const reporterProfile = profiles;

    const rows = await db
        .select({
            id: reports.id,
            reportType: reports.reportType,
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
            reportType: reports.reportType,
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

export type RoomDetail = {
    id: string;
    title: string;
    city: string;
    rentPrice: string;
    status: string;
    description: string | null;
    ownerName: string;
    coverPhotoUrl: string | null;
    createdAt: Date;
};

export async function getRoomDetail(roomId: string): Promise<RoomDetail | null> {
    await requireAdmin();

    const [row] = await db
        .select({
            id: rooms.id,
            title: rooms.title,
            city: rooms.city,
            rentPrice: rooms.rentPrice,
            status: rooms.status,
            description: rooms.description,
            ownerFirstName: profiles.firstName,
            ownerLastName: profiles.lastName,
            createdAt: rooms.createdAt,
        })
        .from(rooms)
        .leftJoin(profiles, eq(profiles.id, rooms.ownerId))
        .where(eq(rooms.id, roomId));

    if (!row) return null;

    const [coverPhoto] = await db
        .select({url: roomPhotos.url})
        .from(roomPhotos)
        .where(eq(roomPhotos.roomId, roomId))
        .orderBy(roomPhotos.slot)
        .limit(1);

    return {
        id: row.id,
        title: row.title,
        city: row.city,
        rentPrice: row.rentPrice,
        status: row.status,
        description: row.description,
        ownerName: [row.ownerFirstName, row.ownerLastName].filter(Boolean).join(" ") || "Unknown",
        coverPhotoUrl: coverPhoto?.url ?? null,
        createdAt: row.createdAt,
    };
}

export type UserDetail = {
    id: string;
    name: string;
    email: string;
    avatarUrl: string | null;
    bio: string | null;
    institutionDomain: string;
    studyProgram: string | null;
    createdAt: Date;
    banned: boolean | null;
};

export async function getUserDetail(userId: string): Promise<UserDetail | null> {
    await requireAdmin();

    const [row] = await db
        .select({
            id: profiles.id,
            firstName: profiles.firstName,
            lastName: profiles.lastName,
            email: profiles.email,
            bio: profiles.bio,
            institutionDomain: profiles.institutionDomain,
            studyProgram: profiles.studyProgram,
            createdAt: profiles.createdAt,
            banned: user.banned,
            avatarUrl: profilePhotos.url,
        })
        .from(profiles)
        .leftJoin(user, eq(user.id, profiles.id))
        .leftJoin(profilePhotos, and(
            eq(profilePhotos.userId, profiles.id),
            eq(profilePhotos.slot, 1)
        ))
        .where(eq(profiles.id, userId));

    if (!row) return null;

    return {
        id: row.id,
        name: `${row.firstName} ${row.lastName}`,
        email: row.email,
        avatarUrl: row.avatarUrl,
        bio: row.bio,
        institutionDomain: row.institutionDomain,
        studyProgram: row.studyProgram,
        createdAt: row.createdAt,
        banned: row.banned,
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

export async function updateReportStatus(
    reportId: string,
    newStatus: ReportStatusType,
    notes?: string,
) {
    const adminSession = await requireAdmin();
    const adminUserId = adminSession.user.id;

    const updateData: {
        status: ReportStatusType;
        resolvedAt?: Date;
        resolvedBy?: string;
    } = {status: newStatus};

    // If moving to resolved or dismissed, set resolved fields
    if (newStatus === ReportStatus.resolved || newStatus === ReportStatus.dismissed) {
        updateData.resolvedAt = new Date();
        updateData.resolvedBy = adminUserId;
    }

    await db.update(reports).set(updateData).where(eq(reports.id, reportId));

    // Log the status change
    await db.insert(adminAuditLog).values({
        adminUserId,
        action: AdminAction.update_report,
        targetId: reportId,
        reason: notes || `Status changed to ${newStatus}`,
        metadata: {newStatus},
    });

    revalidatePath(`/admin/reports/${reportId}`);
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
