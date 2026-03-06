import { db } from "@openhospi/database";
import { hospiEvents, hospiInvitations } from "@openhospi/database/schema";
import { InvitationStatus } from "@openhospi/shared/enums";
import { and, eq, isNull, gte, lte, ne, inArray } from "drizzle-orm";

import { notifyUser } from "@/lib/queries/notifications";

export async function POST(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  const now = new Date();
  const in24h = new Date(Date.now() + 24 * 60 * 60 * 1000);
  const todayStr = now.toISOString().split("T")[0];
  const tomorrowStr = in24h.toISOString().split("T")[0];

  // Find invitations for upcoming events within 24 hours
  // where reminder hasn't been sent and invitee hasn't declined
  const invitations = await db
    .select({
      id: hospiInvitations.id,
      userId: hospiInvitations.userId,
      eventTitle: hospiEvents.title,
      eventDate: hospiEvents.eventDate,
      timeStart: hospiEvents.timeStart,
    })
    .from(hospiInvitations)
    .innerJoin(hospiEvents, eq(hospiInvitations.eventId, hospiEvents.id))
    .where(
      and(
        isNull(hospiInvitations.reminderSentAt),
        ne(hospiInvitations.status, InvitationStatus.not_attending),
        isNull(hospiEvents.cancelledAt),
        gte(hospiEvents.eventDate, todayStr),
        lte(hospiEvents.eventDate, tomorrowStr),
      ),
    );

  if (invitations.length === 0) {
    return Response.json({ sent: 0, failed: 0 });
  }

  const results = await Promise.allSettled(
    invitations.map(async (inv) => {
      await notifyUser(inv.userId, "notifications.reminder", {
        eventTitle: inv.eventTitle,
        time: inv.timeStart,
      });
      return inv.id;
    }),
  );

  // Batch-update reminder_sent_at for successful deliveries
  const sentIds = results
    .filter((r): r is PromiseFulfilledResult<string> => r.status === "fulfilled")
    .map((r) => r.value);

  if (sentIds.length > 0) {
    await db
      .update(hospiInvitations)
      .set({ reminderSentAt: new Date() })
      .where(inArray(hospiInvitations.id, sentIds));
  }

  const failedCount = results.filter((r) => r.status === "rejected").length;

  return Response.json({ sent: sentIds.length, failed: failedCount });
}
