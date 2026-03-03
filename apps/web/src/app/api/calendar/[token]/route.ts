import { db } from "@openhospi/database";
import { hospiEvents, hospiInvitations, profiles, rooms } from "@openhospi/database/schema";
import { computeEndDateTime, generateICSFeed } from "@openhospi/shared/calendar";
import type { CalendarEvent } from "@openhospi/shared/calendar";
import { eq, sql } from "drizzle-orm";

export async function GET(_req: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;

  // Look up user by calendar token
  const [profile] = await db
    .select({ id: profiles.id })
    .from(profiles)
    .where(eq(profiles.calendarToken, token));

  if (!profile) {
    return new Response("Not Found", { status: 404 });
  }

  // Fetch all hospi invitations for this user, with event and room data
  // Include past events for 30 days
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const cutoffDate = thirtyDaysAgo.toISOString().split("T")[0];

  const rows = await db
    .select({
      eventId: hospiEvents.id,
      title: hospiEvents.title,
      description: hospiEvents.description,
      eventDate: hospiEvents.eventDate,
      timeStart: hospiEvents.timeStart,
      timeEnd: hospiEvents.timeEnd,
      location: hospiEvents.location,
      cancelledAt: hospiEvents.cancelledAt,
      sequence: hospiEvents.sequence,
      createdAt: hospiEvents.createdAt,
      updatedAt: hospiEvents.updatedAt,
      roomTitle: rooms.title,
    })
    .from(hospiInvitations)
    .innerJoin(hospiEvents, eq(hospiEvents.id, hospiInvitations.eventId))
    .innerJoin(rooms, eq(rooms.id, hospiEvents.roomId))
    .where(
      sql`${hospiInvitations.userId} = ${profile.id} AND ${hospiEvents.eventDate} >= ${cutoffDate}`,
    );

  const events: CalendarEvent[] = rows.map((row) => {
    const endTime = row.timeEnd ?? addHours(row.timeStart, 2);
    const end = computeEndDateTime(row.eventDate, row.timeStart, endTime);

    return {
      uid: `${row.eventId}@openhospi.nl`,
      title: row.title,
      description: row.description ?? undefined,
      location: row.location ?? undefined,
      startDate: row.eventDate,
      startTime: row.timeStart,
      endDate: end.endDate,
      endTime: end.endTime,
      sequence: row.sequence,
      status: row.cancelledAt ? "CANCELLED" : "CONFIRMED",
      created: row.createdAt,
      lastModified: row.updatedAt,
    };
  });

  const ics = generateICSFeed(events);

  return new Response(ics, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": 'inline; filename="openhospi.ics"',
      "Cache-Control": "no-cache, no-store",
    },
  });
}

function addHours(time: string, hours: number): string {
  const t = time.slice(0, 5);
  const [h, m] = t.split(":").map(Number);
  const newH = (h + hours) % 24;
  return `${String(newH).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}
