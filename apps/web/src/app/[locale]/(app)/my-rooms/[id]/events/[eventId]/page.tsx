import { ArrowLeft, Calendar, Clock, MapPin, Users, UserCircle } from "lucide-react";
import { Link, redirect } from "@/i18n/navigation-app";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { AddToCalendarButton } from "@/components/app/add-to-calendar-button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getRoomApplicants } from "@/lib/applicants";
import { requireHousemate, requireSession } from "@/lib/auth-server";
import { getEventDetail } from "@/lib/events";
import { INVITATION_STATUS_COLORS } from "@/lib/status-colors";
import { cn } from "@/lib/utils";

import { InviteApplicantsDialog } from "../invite-applicants-dialog";

import { CancelEventButton } from "./cancel-event-button";

type Props = {
  params: Promise<{ locale: string; id: string; eventId: string }>;
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; id: string; eventId: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "app.rooms.events" });
  return { title: t("detailTitle") };
}

export default async function EventDetailPage({ params }: Props) {
  const { locale, id: roomId, eventId } = await params;
  setRequestLocale(locale);
  const { user } = await requireSession();
  await requireHousemate(roomId, user.id);

  const event = await getEventDetail(eventId, user.id);
  if (!event || event.roomId !== roomId) {
    return redirect(`/my-rooms/${roomId}`);
  }

  const applicants = await getRoomApplicants(roomId, user.id);
  const t = await getTranslations("app.rooms.events");
  const tEnums = await getTranslations("enums");
  const isCreator = event.createdBy === user.id;
  const isCancelled = !!event.cancelledAt;

  const grouped = {
    attending: event.invitees.filter((i) => i.status === "attending"),
    maybe: event.invitees.filter((i) => i.status === "maybe"),
    pending: event.invitees.filter((i) => i.status === "pending"),
    not_attending: event.invitees.filter((i) => i.status === "not_attending"),
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Button variant="ghost" size="sm" asChild>
        <Link href={`/my-rooms/${roomId}`}>
          <ArrowLeft className="size-4" />
          {t("backToRoom")}
        </Link>
      </Button>

      <div className="space-y-2">
        <div className="flex items-start justify-between">
          <h1 className="text-2xl font-bold">{event.title}</h1>
          {isCancelled && <Badge variant="destructive">{t("cancelled")}</Badge>}
        </div>

        <div className="space-y-1 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Calendar className="size-4" />
            {event.eventDate}
          </div>
          <div className="flex items-center gap-2">
            <Clock className="size-4" />
            {event.timeStart}
            {event.timeEnd && ` – ${event.timeEnd}`}
          </div>
          {event.location && (
            <div className="flex items-center gap-2">
              <MapPin className="size-4" />
              {event.location}
            </div>
          )}
          {event.maxAttendees && (
            <div className="flex items-center gap-2">
              <Users className="size-4" />
              {t("maxAttendees", { count: event.maxAttendees })}
            </div>
          )}
        </div>
      </div>

      {event.description && (
        <p className="whitespace-pre-line text-sm text-muted-foreground">{event.description}</p>
      )}

      {event.notes && (
        <div className="rounded-lg bg-muted p-3">
          <p className="text-sm">{event.notes}</p>
        </div>
      )}

      {/* Invitees */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("invitees")}</CardTitle>
        </CardHeader>
        <CardContent>
          {event.invitees.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t("noInvitees")}</p>
          ) : (
            <div className="space-y-4">
              {(["attending", "maybe", "pending", "not_attending"] as const).map(
                (status) =>
                  grouped[status].length > 0 && (
                    <div key={status}>
                      <h4 className="mb-2 text-sm font-medium">
                        {tEnums(`invitation_status.${status}`)} ({grouped[status].length})
                      </h4>
                      <div className="space-y-2">
                        {grouped[status].map((invitee) => (
                          <div key={invitee.invitationId} className="flex items-center gap-3">
                            <Avatar>
                              {invitee.avatarUrl ? (
                                <AvatarImage src={invitee.avatarUrl} alt={invitee.firstName} />
                              ) : (
                                <AvatarFallback>
                                  <UserCircle className="size-5" />
                                </AvatarFallback>
                              )}
                            </Avatar>
                            <span className="text-sm font-medium">
                              {invitee.firstName} {invitee.lastName}
                            </span>
                            <Badge
                              className={cn("ml-auto shrink-0", INVITATION_STATUS_COLORS[status])}
                            >
                              {tEnums(`invitation_status.${status}`)}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  ),
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Actions */}
      {!isCancelled && (
        <div className="flex flex-wrap gap-2">
          <InviteApplicantsDialog eventId={eventId} roomId={roomId} applicants={applicants} />
          <AddToCalendarButton
            uid={eventId}
            title={event.title}
            description={event.description ?? undefined}
            location={event.location}
            startDate={event.eventDate}
            startTime={event.timeStart}
            endTime={event.timeEnd}
          />
          {isCreator && <CancelEventButton eventId={eventId} roomId={roomId} />}
        </div>
      )}
    </div>
  );
}
