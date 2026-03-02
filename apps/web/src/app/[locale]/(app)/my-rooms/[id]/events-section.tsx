import {Calendar, MapPin, Users} from "lucide-react";
import {getTranslations} from "next-intl/server";

import {Badge} from "@/components/ui/badge";
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";
import {Link} from "@/i18n/navigation-app";
import {getRoomEvents} from "@/lib/events";
import {cn} from "@/lib/utils";

import {CreateEventDialog} from "./events/create-event-dialog";

type Props = {
    roomId: string;
    userId: string;
};

export async function EventsSection({roomId, userId}: Props) {
    const events = await getRoomEvents(roomId, userId);
    const t = await getTranslations("app.rooms.events");

    return (
        <section className="space-y-4">
            <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">{t("title")}</h2>
                <CreateEventDialog roomId={roomId}/>
            </div>

            {events.length === 0 ? (
                <div className="rounded-lg border border-dashed p-8 text-center">
                    <p className="text-muted-foreground">{t("empty")}</p>
                </div>
            ) : (
                <div className="grid gap-4 sm:grid-cols-2">
                    {events.map((event) => (
                        <Link key={event.id} href={`/my-rooms/${roomId}/events/${event.id}`}>
                            <Card
                                className={cn(
                                    "transition-colors hover:bg-muted/50",
                                    event.cancelledAt && "opacity-60",
                                )}
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
                                        <Calendar className="size-3.5"/>
                                        {event.eventDate} · {event.timeStart}
                                        {event.timeEnd && ` – ${event.timeEnd}`}
                                    </div>
                                    {event.location && (
                                        <div className="flex items-center gap-1.5">
                                            <MapPin className="size-3.5"/>
                                            <span className="truncate">{event.location}</span>
                                        </div>
                                    )}
                                    <div className="flex items-center gap-1.5">
                                        <Users className="size-3.5"/>
                                        {t("attendingCount", {
                                            attending: String(event.attendingCount),
                                            total: String(event.invitedCount),
                                        })}
                                    </div>
                                </CardContent>
                            </Card>
                        </Link>
                    ))}
                </div>
            )}
        </section>
    );
}
