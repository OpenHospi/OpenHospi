"use client";

import { DataRequestStatus } from "@openhospi/shared/enums";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useParams } from "next/navigation";
import { useFormatter, useTranslations } from "next-intl";
import { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useRouter } from "@/i18n/navigation-app";

import { getDataRequestDetail, updateDataRequestStatus } from "../../data-request-actions";

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  in_progress: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  completed: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  denied: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
};

type RequestDetail = Awaited<ReturnType<typeof getDataRequestDetail>>;

export default function DataRequestDetailPage() {
  const params = useParams<{ requestId: string }>();
  const router = useRouter();
  const t = useTranslations("admin.dataRequests");
  const format = useFormatter();

  const [detail, setDetail] = useState<RequestDetail>(null);
  const [newStatus, setNewStatus] = useState<DataRequestStatus | "">("");
  const [notes, setNotes] = useState("");
  const [isUpdating, startUpdate] = useTransition();

  useEffect(() => {
    getDataRequestDetail(params.requestId).then(setDetail);
  }, [params.requestId]);

  function handleUpdateStatus() {
    if (!newStatus) return;
    startUpdate(async () => {
      await updateDataRequestStatus(params.requestId, newStatus as DataRequestStatus, notes);
      toast.success(t("detail.statusUpdated"));
      const updated = await getDataRequestDetail(params.requestId);
      setDetail(updated);
      setNewStatus("");
      setNotes("");
    });
  }

  if (!detail) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="size-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Button variant="ghost" onClick={() => router.push("/admin/data-requests")}>
        <ArrowLeft className="size-4" />
        {t("detail.backToList")}
      </Button>

      <div>
        <h1 className="text-3xl font-bold tracking-tight">{t("detail.title")}</h1>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{t("detail.userInfo")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-sm">
              <span className="font-medium">{detail.userName}</span>
            </p>
            <p className="text-sm text-muted-foreground">{detail.userEmail}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("detail.requestInfo")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2">
              <Badge variant="outline">
                {t(`types.${detail.type}` as Parameters<typeof t>[0])}
              </Badge>
              <Badge className={STATUS_COLORS[detail.status] ?? ""}>
                {t(`statuses.${detail.status}` as Parameters<typeof t>[0])}
              </Badge>
            </div>
            <p className="text-sm">
              {format.dateTime(detail.createdAt, "dateTime")}
            </p>
            {detail.description && (
              <p className="text-sm text-muted-foreground">{detail.description}</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("detail.adminNotes")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {detail.adminNotes && (
            <div className="rounded-lg bg-muted p-3">
              <p className="text-sm">{detail.adminNotes}</p>
            </div>
          )}

          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder={t("detail.notesPlaceholder")}
            className="min-h-20 resize-none"
          />

          <div className="flex items-center gap-3">
            <Select value={newStatus} onValueChange={(v) => setNewStatus(v as DataRequestStatus)}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder={t("detail.updateStatus")} />
              </SelectTrigger>
              <SelectContent>
                {DataRequestStatus.values.map((s) => (
                  <SelectItem key={s} value={s}>
                    {t(`statuses.${s}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={handleUpdateStatus} disabled={isUpdating || !newStatus}>
              {isUpdating && <Loader2 className="animate-spin" />}
              {t("detail.updateStatus")}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
