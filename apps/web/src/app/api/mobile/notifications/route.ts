import { NextResponse } from "next/server";

import { requireApiSession, apiError } from "@/app/api/mobile/_lib/auth";
import {
  getUserNotifications,
  getUnreadNotificationCount,
  markAllNotificationsRead,
} from "@/lib/queries/notifications";

export async function GET(request: Request) {
  try {
    const session = await requireApiSession(request);
    const url = new URL(request.url);
    const cursor = url.searchParams.get("cursor") ?? undefined;

    const [{ items, nextCursor }, unreadCount] = await Promise.all([
      getUserNotifications(session.user.id, cursor),
      getUnreadNotificationCount(session.user.id),
    ]);

    return NextResponse.json({ notifications: items, unreadCount, nextCursor });
  } catch (e) {
    if (e instanceof NextResponse) return e;
    return apiError("Internal server error", 500);
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireApiSession(request);
    const { action } = (await request.json()) as { action: string };

    if (action === "mark-all-read") {
      await markAllNotificationsRead(session.user.id);
      return NextResponse.json({ success: true });
    }

    return apiError("Unknown action", 400);
  } catch (e) {
    if (e instanceof NextResponse) return e;
    return apiError("Internal server error", 500);
  }
}
