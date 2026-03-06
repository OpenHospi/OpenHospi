import { withRLS } from "@openhospi/database";
import { hospiEvents, hospiInvitations } from "@openhospi/database/schema";
import { computeEndDateTime, generateICS } from "@openhospi/shared/calendar";
import { eq, and } from "drizzle-orm";

import { requireSession } from "@/lib/auth/server";

export async function GET(_req: Request, { params }: { params: Promise<{ eventId: string }> }) {
  const { eventId } = await params;
  const session = await requireSession();

  const result = await withRLS(session.user.id, async (tx) => {
    // Verify user has an invitation to this event
    const [invitation] = await tx
      .select({ id: hospiInvitations.id })
      .from(hospiInvitations)
      .where(
        and(eq(hospiInvitations.eventId, eventId), eq(hospiInvitations.userId, session.user.id)),
      );

    if (!invitation) return null;

    const [event] = await tx.select().from(hospiEvents).where(eq(hospiEvents.id, eventId));

    return event;
  });

  if (!result) {
    return new Response("Not Found", { status: 404 });
  }

  const endTime = result.timeEnd ?? addHours(result.timeStart, 2);
  const end = computeEndDateTime(result.eventDate, result.timeStart, endTime);

  const ics = generateICS({
    uid: `${result.id}@openhospi.nl`,
    title: result.title,
    description: result.description ?? undefined,
    location: result.location ?? undefined,
    startDate: result.eventDate,
    startTime: result.timeStart,
    endDate: end.endDate,
    endTime: end.endTime,
    sequence: result.sequence,
    status: result.cancelledAt ? "CANCELLED" : "CONFIRMED",
    created: result.createdAt,
    lastModified: result.updatedAt,
  });

  const filename = result.title.replaceAll(/[^a-zA-Z0-9]/g, "_").slice(0, 100);

  return new Response(ics, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}.ics"`,
      "Cache-Control": "no-store, private",
    },
  });
}

function addHours(time: string, hours: number): string {
  const t = time.slice(0, 5);
  const [h, m] = t.split(":").map(Number);
  const newH = (h + hours) % 24;
  return `${String(newH).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}
