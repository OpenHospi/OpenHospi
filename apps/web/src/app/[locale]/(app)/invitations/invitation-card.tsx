"use client";

import { MAX_DECLINE_REASON_LENGTH } from "@openhospi/shared/constants";
import type { InvitationStatus as InvitationStatusType } from "@openhospi/shared/enums";
import { InvitationStatus } from "@openhospi/shared/enums";
import { Calendar, Check, Clock, Loader2, MapPin, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { AddToCalendarButton } from "@/components/app/add-to-calendar-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import type { UserInvitation } from "@/lib/invitations";
import { INVITATION_STATUS_COLORS } from "@/lib/status-colors";
import { cn } from "@/lib/utils";

import { respondToInvitation } from "./rsvp-actions";

type Props = {
  invitation: UserInvitation;
};

export function InvitationCard({ invitation }: Props) {
  const t = useTranslations("app.invitations");
  const tEnums = useTranslations("enums");
  const [isPending, startTransition] = useTransition();
  const [showDeclineForm, setShowDeclineForm] = useState(false);
  const [declineReason, setDeclineReason] = useState("");
  const router = useRouter();

  const isCancelled = !!invitation.cancelledAt;
  const isTerminal = invitation.status === InvitationStatus.not_attending;

  function handleRsvp(status: InvitationStatusType) {
    if (status === InvitationStatus.not_attending) {
      setShowDeclineForm(true);
      return;
    }
    startTransition(async () => {
      const result = await respondToInvitation(invitation.invitationId, { status });
      if (result?.error) {
        toast.error(t(`errors.${result.error}`));
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
        toast.error(t(`errors.${result.error}`));
        return;
      }
      toast.success(t("rsvpSuccess"));
      setShowDeclineForm(false);
      router.refresh();
    });
  }

  return (
    <Card className={cn(isCancelled && "opacity-60")}>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-base">{invitation.eventTitle}</CardTitle>
            <p className="text-sm text-muted-foreground">{invitation.roomTitle}</p>
          </div>
          <Badge
            className={cn(
              "shrink-0",
              isCancelled
                ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                : INVITATION_STATUS_COLORS[invitation.status],
            )}
          >
            {isCancelled ? t("cancelled") : tEnums(`invitation_status.${invitation.status}`)}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-1 text-sm text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <Calendar className="size-3.5" />
            {invitation.eventDate}
          </div>
          <div className="flex items-center gap-1.5">
            <Clock className="size-3.5" />
            {invitation.timeStart}
            {invitation.timeEnd && ` – ${invitation.timeEnd}`}
          </div>
          {invitation.location && (
            <div className="flex items-center gap-1.5">
              <MapPin className="size-3.5" />
              {invitation.location}
            </div>
          )}
        </div>

        {/* RSVP buttons */}
        {!isCancelled && !isTerminal && !showDeclineForm && (
          <div className="flex gap-2">
            {invitation.status !== InvitationStatus.attending && (
              <Button
                size="sm"
                onClick={() => handleRsvp(InvitationStatus.attending)}
                disabled={isPending}
              >
                {isPending ? <Loader2 className="animate-spin" /> : <Check className="size-3.5" />}
                {t("attend")}
              </Button>
            )}
            {invitation.status !== InvitationStatus.maybe &&
              invitation.status !== InvitationStatus.attending && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleRsvp(InvitationStatus.maybe)}
                  disabled={isPending}
                >
                  {t("maybe")}
                </Button>
              )}
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

        {/* Calendar export */}
        {!isCancelled &&
          (invitation.status === InvitationStatus.attending ||
            invitation.status === InvitationStatus.maybe) && (
            <AddToCalendarButton
              uid={invitation.invitationId}
              title={invitation.eventTitle}
              location={invitation.location}
              startDate={invitation.eventDate}
              startTime={invitation.timeStart}
              endTime={invitation.timeEnd}
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
