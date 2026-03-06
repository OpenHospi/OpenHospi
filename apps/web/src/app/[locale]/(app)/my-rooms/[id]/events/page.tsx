import type { Locale } from "@openhospi/i18n";
import { Calendar, MapPin, Users } from "lucide-react";
import { hasLocale } from "next-intl";
import { getFormatter, getTranslations, setRequestLocale } from "next-intl/server";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "@/i18n/navigation-app";
import { routing } from "@/i18n/routing";
import { requireSession } from "@/lib/auth/server";
import { getRoomEvents } from "@/lib/queries/events";
import { cn } from "@/lib/utils";

import { CreateEventDialog } from "./create-event-dialog";

type Props = {
  params: Promise<{ locale: Locale; id: string }>;
};

export default async function EventsPage({ params }: Props) {
  const { locale, id: roomId } = await params;
  if (!hasLocale(routing.locales, locale)) return null;
  setRequestLocale(locale);
  const { user } = await requireSession();

  const events = await getRoomEvents(roomId, user.id);
  const format = await getFormatter();
  const t = await getTranslations("app.rooms.events");

  const today = new Date().toISOString().split("T")[0];
  const upcoming = events.filter((e) => e.eventDate >= today && !e.cancelledAt);
  const past = events.filter((e) => e.eventDate < today || !!e.cancelledAt);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">{t("title")}</h2>
        <CreateEventDialog roomId={roomId} />
      </div>

      {events.length === 0 ? (
        <div className="rounded-lg border border-dashed p-8 text-center">
          <p className="text-muted-foreground">{t("empty")}</p>
        </div>
      ) : (
        <>
          {/* Upcoming */}
          {upcoming.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-muted-foreground">{t("upcoming")}</h3>
              <div className="grid gap-4 sm:grid-cols-2">
                {upcoming.map((event) => (
                  <EventCard key={event.id} event={event} roomId={roomId} format={format} t={t} />
                ))}
              </div>
            </div>
          )}

          {/* Past */}
          {past.length > 0 && (
            <details className="group">
              <summary className="cursor-pointer text-sm font-medium text-muted-foreground hover:text-foreground">
                {t("past")} ({past.length})
              </summary>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                {past.map((event) => (
                  <EventCard key={event.id} event={event} roomId={roomId} format={format} t={t} />
                ))}
              </div>
            </details>
          )}
        </>
      )}
    </div>
  );
}

type EventCardProps = {
  event: {
    id: string;
    title: string;
    eventDate: string;
    timeStart: string;
    timeEnd: string | null;
    location: string | null;
    cancelledAt: Date | null;
    attendingCount: number;
    invitedCount: number;
  };
  roomId: string;
  format: Awaited<ReturnType<typeof getFormatter>>;
  t: Awaited<ReturnType<typeof getTranslations<"app.rooms.events">>>;
};

function EventCard({ event, roomId, format, t }: EventCardProps) {
  return (
    <Link href={`/my-rooms/${roomId}/events/${event.id}`}>
      <Card
        className={cn("transition-colors hover:bg-muted/50", event.cancelledAt && "opacity-60")}
      >
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between">
            <CardTitle className="text-base">{event.title}</CardTitle>
            {event.cancelledAt && (
              <Badge variant="destructive" className="shrink-0">
                {t("cancelled")}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-1 text-sm text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <Calendar className="size-3.5" />
            {format.dateTime(new Date(event.eventDate + "T00:00:00"), "short")} ·{" "}
            {event.timeStart.slice(0, 5)}
            {event.timeEnd && ` – ${event.timeEnd.slice(0, 5)}`}
          </div>
          {event.location && (
            <div className="flex items-center gap-1.5">
              <MapPin className="size-3.5" />
              <span className="truncate">{event.location}</span>
            </div>
          )}
          <div className="flex items-center gap-1.5">
            <Users className="size-3.5" />
            {t("attendingCount", {
              attending: String(event.attendingCount),
              total: String(event.invitedCount),
            })}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
