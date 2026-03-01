"use client";

import { Ban, ShieldCheck, Trash2, XCircle } from "lucide-react";
import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

import { banUser, dismissReport, removeListing, unbanUser } from "../../actions";

type Props = {
  reportId: string;
  reportedUserId: string | null;
  reportedRoomId: string | null;
  reportedUserBanned: boolean;
};

export function ReportActions({
  reportId,
  reportedUserId,
  reportedRoomId,
  reportedUserBanned,
}: Props) {
  const t = useTranslations("admin.reports");
  const tCommon = useTranslations("common.labels");
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
          <Label>{t("actionReason")}</Label>
          <Textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder={t("actionReasonPlaceholder")}
            rows={3}
          />
        </div>

        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={handleDismiss} disabled={!reason.trim() || isPending}>
            <XCircle className="mr-2 size-4" />
            {t("dismiss")}
          </Button>

          {reportedUserId && !reportedUserBanned && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" disabled={!reason.trim() || isPending}>
                  <Ban className="mr-2 size-4" />
                  {t("banUser")}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>{t("confirmBanTitle")}</AlertDialogTitle>
                  <AlertDialogDescription>{t("confirmBanDescription")}</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>{tCommon("cancel")}</AlertDialogCancel>
                  <AlertDialogAction onClick={handleBan}>{t("banUser")}</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}

          {reportedUserId && reportedUserBanned && (
            <Button variant="outline" onClick={handleUnban} disabled={!reason.trim() || isPending}>
              <ShieldCheck className="mr-2 size-4" />
              {t("unbanUser")}
            </Button>
          )}

          {reportedRoomId && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" disabled={!reason.trim() || isPending}>
                  <Trash2 className="mr-2 size-4" />
                  {t("removeListing")}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>{t("confirmRemoveTitle")}</AlertDialogTitle>
                  <AlertDialogDescription>{t("confirmRemoveDescription")}</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>{tCommon("cancel")}</AlertDialogCancel>
                  <AlertDialogAction onClick={handleRemoveListing}>
                    {t("removeListing")}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
