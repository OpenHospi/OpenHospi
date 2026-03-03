"use client";

import { MAX_DECLINE_REASON_LENGTH } from "@openhospi/shared/constants";
import { InvitationStatus } from "@openhospi/shared/enums";
import { Calendar, Check, Clock, HelpCircle, Loader2, MapPin, X } from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { AddToCalendarButton } from "@/components/app/add-to-calendar-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useRouter } from "@/i18n/navigation-app";
import type { UserInvitation } from "@/lib/invitations";
import { INVITATION_STATUS_COLORS } from "@/lib/status-colors";
import { cn } from "@/lib/utils";

import { respondToInvitation } from "./rsvp-actions";

type Props = {
  invitation: UserInvitation;
  calendarToken?: string | null;
};

export function HospiInvitationCard({ invitation, calendarToken }: Props) {
  const t = useTranslations("app.invitations");
  const tEnums = useTranslations("enums");
  const format = useFormatter();
  const [isPending, startTransition] = useTransition();
  const [showDeclineForm, setShowDeclineForm] = useState(false);
  const [declineReason, setDeclineReason] = useState("");
  const router = useRouter();

  const isCancelled = !!invitation.cancelledAt;
  const isDeclined = invitation.status === InvitationStatus.not_attending;
  const hasResponded = invitation.status !== InvitationStatus.pending;

  // Countdown for deadline < 48h — capture current time in state to avoid impure Date.now() during render
  const [now] = useState(() => Date.now());
  const deadlineSoon =
    invitation.rsvpDeadline &&
    !isCancelled &&
    !isDeclined &&
    new Date(invitation.rsvpDeadline).getTime() - now < 48 * 60 * 60 * 1000 &&
    new Date(invitation.rsvpDeadline).getTime() > now;

  function handleRsvp(status: InvitationStatus) {
    if (status === InvitationStatus.not_attending) {
      setShowDeclineForm(true);
      return;
    }
    startTransition(async () => {
      const result = await respondToInvitation(invitation.invitationId, { status });
      if (result?.error) {
        toast.error(t(`errors.${result.error}` as Parameters<typeof t>[0]));
        return;
      }
      toast.success(t("rsvpSuccess"));
      router.refresh();
    });
  }

  function handleDeclineSubmit() {
    if (!declineReason.trim()) return;
    startTransition(async () => {
      const result = await respondToInvitation(invitation.invitationId, {
        status: InvitationStatus.not_attending,
        declineReason: declineReason.trim(),
      });
      if (result?.error) {
        toast.error(t(`errors.${result.error}` as Parameters<typeof t>[0]));
        return;
      }
      toast.success(t("rsvpSuccess"));
      setShowDeclineForm(false);
      router.refresh();
    });
  }

  return (
    <Card className={cn("border-l-4 border-l-purple-500", isCancelled && "opacity-60")}>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <CardTitle className="text-base">{t("hospiTitle")}</CardTitle>
          {isCancelled ? (
            <Badge variant="destructive">{t("cancelled")}</Badge>
          ) : (
            hasResponded && (
              <Badge className={cn("shrink-0", INVITATION_STATUS_COLORS[invitation.status])}>
                {tEnums(`invitation_status.${invitation.status}`)}
              </Badge>
            )
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Event details */}
        <div className="space-y-1.5 text-sm text-muted-foreground">
          <p className="font-medium text-foreground">{invitation.eventTitle}</p>
          <div className="flex items-center gap-1.5">
            <Calendar className="size-3.5 shrink-0" />
            {format.dateTime(new Date(invitation.eventDate + "T00:00:00"), "short")}
          </div>
          <div className="flex items-center gap-1.5">
            <Clock className="size-3.5 shrink-0" />
            {invitation.timeStart.slice(0, 5)}
            {invitation.timeEnd && ` – ${invitation.timeEnd.slice(0, 5)}`}
          </div>
          {invitation.location && (
            <div className="flex items-center gap-1.5">
              <MapPin className="size-3.5 shrink-0" />
              {invitation.location}
            </div>
          )}
        </div>

        {/* Deadline warning */}
        {deadlineSoon && (
          <p className="text-sm font-medium text-orange-600 dark:text-orange-400">
            {t("deadlineSoon", {
              deadline: format.relativeTime(new Date(invitation.rsvpDeadline!)),
            })}
          </p>
        )}

        {/* RSVP buttons — pending: show all three options */}
        {!isCancelled && invitation.status === InvitationStatus.pending && !showDeclineForm && (
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              onClick={() => handleRsvp(InvitationStatus.attending)}
              disabled={isPending}
            >
              {isPending ? <Loader2 className="animate-spin" /> : <Check className="size-3.5" />}
              {t("attend")}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleRsvp(InvitationStatus.maybe)}
              disabled={isPending}
            >
              <HelpCircle className="size-3.5" />
              {t("maybe")}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleRsvp(InvitationStatus.not_attending)}
              disabled={isPending}
            >
              <X className="size-3.5" />
              {t("decline")}
            </Button>
          </div>
        )}

        {/* Change response — attending: can decline */}
        {!isCancelled && invitation.status === InvitationStatus.attending && !showDeclineForm && (
          <Button
            size="sm"
            variant="ghost"
            onClick={() => handleRsvp(InvitationStatus.not_attending)}
            disabled={isPending}
          >
            <X className="size-3.5" />
            {t("decline")}
          </Button>
        )}

        {/* Change response — maybe: can attend or decline */}
        {!isCancelled && invitation.status === InvitationStatus.maybe && !showDeclineForm && (
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              onClick={() => handleRsvp(InvitationStatus.attending)}
              disabled={isPending}
            >
              {isPending ? <Loader2 className="animate-spin" /> : <Check className="size-3.5" />}
              {t("attend")}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => handleRsvp(InvitationStatus.not_attending)}
              disabled={isPending}
            >
              <X className="size-3.5" />
              {t("decline")}
            </Button>
          </div>
        )}

        {/* Calendar export */}
        {!isCancelled &&
          (invitation.status === InvitationStatus.attending ||
            invitation.status === InvitationStatus.maybe) && (
            <AddToCalendarButton
              uid={invitation.eventId}
              calendarToken={calendarToken}
              title={invitation.eventTitle}
              startDate={invitation.eventDate}
              startTime={invitation.timeStart}
              endTime={invitation.timeEnd}
              location={invitation.location}
            />
          )}

        {/* Decline reason form */}
        {showDeclineForm && (
          <div className="space-y-2 rounded-lg border p-3">
            <p className="text-sm font-medium">{t("declineReasonLabel")}</p>
            <Textarea
              value={declineReason}
              onChange={(e) => setDeclineReason(e.target.value)}
              placeholder={t("declineReasonPlaceholder")}
              maxLength={MAX_DECLINE_REASON_LENGTH}
              className="min-h-16 resize-none"
            />
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="destructive"
                onClick={handleDeclineSubmit}
                disabled={isPending || !declineReason.trim()}
              >
                {isPending && <Loader2 className="animate-spin" />}
                {t("confirmDecline")}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setShowDeclineForm(false)}
                disabled={isPending}
              >
                {t("cancelDecline")}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
