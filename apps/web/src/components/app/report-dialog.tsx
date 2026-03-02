"use client";

import { ReportReason } from "@openhospi/shared/enums";
import { Flag } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { reportMessage, reportRoom, reportUser } from "@/lib/report-actions";

type Props = {
  type: "user" | "room" | "message";
  targetId: string;
  /** For message reports: the user who sent the message */
  reportedUserId?: string;
  /** For message reports: the decrypted text (already available client-side) */
  decryptedMessageText?: string;
  /** Custom trigger button — if not provided, a default Flag button is shown */
  trigger?: React.ReactNode;
};

export function ReportDialog({
  type,
  targetId,
  reportedUserId,
  decryptedMessageText,
  trigger,
}: Props) {
  const t = useTranslations("app.report");
  const tCommon = useTranslations("common.labels");
  const tEnums = useTranslations("enums");
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<ReportReason | "">("");
  const [description, setDescription] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleSubmit() {
    if (!reason) return;

    startTransition(async () => {
      try {
        if (type === "message" && reportedUserId) {
          await reportMessage({
            reportedUserId,
            reportedMessageId: targetId,
            reason,
            description: description || undefined,
            decryptedMessageText,
          });
        } else if (type === "user") {
          await reportUser({
            reportedUserId: targetId,
            reason,
            description: description || undefined,
          });
        } else if (type === "room") {
          await reportRoom({
            reportedRoomId: targetId,
            reason,
            description: description || undefined,
          });
        }

        toast.success(t("success"));
        setOpen(false);
        setReason("");
        setDescription("");
      } catch {
        toast.error(t("error"));
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button variant="ghost" size="sm">
            <Flag className="size-4" />
            {t("button")}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("title")}</DialogTitle>
          <DialogDescription>{t("description")}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>{t("reasonLabel")}</Label>
            <Select value={reason} onValueChange={(v) => setReason(v as ReportReason)}>
              <SelectTrigger>
                <SelectValue placeholder={t("reasonPlaceholder")} />
              </SelectTrigger>
              <SelectContent>
                {ReportReason.values.map((r) => (
                  <SelectItem key={r} value={r}>
                    {tEnums(`report_reason.${r}` as any)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>{t("descriptionLabel")}</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t("descriptionPlaceholder")}
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={isPending}>
            {tCommon("cancel")}
          </Button>
          <Button onClick={handleSubmit} disabled={!reason || isPending} variant="destructive">
            {t("submit")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
