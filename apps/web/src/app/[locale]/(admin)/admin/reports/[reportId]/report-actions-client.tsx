"use client";

import { Ban, ShieldCheck, Trash2, XCircle } from "lucide-react";
import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";

import { banUser, dismissReport, removeListing, unbanUser } from "../../actions";

type Props = {
  reportId: string;
  reportedUserId: string | null;
  reportedRoomId: string | null;
  reportedUserBanned: boolean;
};

export function ReportActions({ reportId, reportedUserId, reportedRoomId, reportedUserBanned }: Props) {
  const t = useTranslations("admin.reports");
  const [reason, setReason] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleDismiss() {
    if (!reason.trim()) return;
    startTransition(async () => {
      try {
        await dismissReport(reportId, reason);
        toast.success(t("dismissed"));
      } catch {
        toast.error(t("error"));
      }
    });
  }

  function handleBan() {
    if (!reason.trim() || !reportedUserId) return;
    startTransition(async () => {
      try {
        await banUser(reportId, reportedUserId, reason);
        toast.success(t("userBanned"));
      } catch {
        toast.error(t("error"));
      }
    });
  }

  function handleUnban() {
    if (!reason.trim() || !reportedUserId) return;
    startTransition(async () => {
      try {
        await unbanUser(reportedUserId, reason);
        toast.success(t("userUnbanned"));
      } catch {
        toast.error(t("error"));
      }
    });
  }

  function handleRemoveListing() {
    if (!reason.trim() || !reportedRoomId) return;
    startTransition(async () => {
      try {
        await removeListing(reportId, reportedRoomId, reason);
        toast.success(t("listingRemoved"));
      } catch {
        toast.error(t("error"));
      }
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("actions")}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">{t("actionReason")}</label>
          <Textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder={t("actionReasonPlaceholder")}
            rows={3}
          />
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            onClick={handleDismiss}
            disabled={!reason.trim() || isPending}
          >
            <XCircle className="mr-2 size-4" />
            {t("dismiss")}
          </Button>

          {reportedUserId && !reportedUserBanned && (
            <Button
              variant="destructive"
              onClick={handleBan}
              disabled={!reason.trim() || isPending}
            >
              <Ban className="mr-2 size-4" />
              {t("banUser")}
            </Button>
          )}

          {reportedUserId && reportedUserBanned && (
            <Button
              variant="outline"
              onClick={handleUnban}
              disabled={!reason.trim() || isPending}
            >
              <ShieldCheck className="mr-2 size-4" />
              {t("unbanUser")}
            </Button>
          )}

          {reportedRoomId && (
            <Button
              variant="destructive"
              onClick={handleRemoveListing}
              disabled={!reason.trim() || isPending}
            >
              <Trash2 className="mr-2 size-4" />
              {t("removeListing")}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
