import { db } from "@openhospi/database";
import { hospiEvents, hospiInvitations } from "@openhospi/database/schema";
import { InvitationStatus } from "@openhospi/shared/enums";
import { and, eq, isNull, ne, sql } from "drizzle-orm";
import { NextResponse } from "next/server";

import { notifyUser } from "@/lib/notifications";

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Find invitations for uncancelled events starting within the next 24 hours
  // where the reminder hasn't been sent yet and the invitee hasn't declined
  const invitations = await db
    .select({
      invitationId: hospiInvitations.id,
      userId: hospiInvitations.userId,
      eventTitle: hospiEvents.title,
      eventDate: hospiEvents.eventDate,
      timeStart: hospiEvents.timeStart,
    })
    .from(hospiInvitations)
    .innerJoin(hospiEvents, eq(hospiEvents.id, hospiInvitations.eventId))
    .where(
      and(
        isNull(hospiEvents.cancelledAt),
        isNull(hospiInvitations.reminderSentAt),
        ne(hospiInvitations.status, InvitationStatus.not_attending),
        // Event starts within the next 24 hours (using Europe/Amsterdam timezone)
        sql`(${hospiEvents.eventDate}::date + ${hospiEvents.timeStart}::time) AT TIME ZONE 'Europe/Amsterdam' BETWEEN now() AND now() + interval '24 hours'`,
      ),
    );

  let sent = 0;
  for (const inv of invitations) {
    await notifyUser(inv.userId, "notifications.reminder", {
      eventTitle: inv.eventTitle,
      time: `${inv.eventDate} ${inv.timeStart}`,
    });

    await db
      .update(hospiInvitations)
      .set({ reminderSentAt: new Date() })
      .where(eq(hospiInvitations.id, inv.invitationId));

    sent++;
  }

  return NextResponse.json({ sent });
}
