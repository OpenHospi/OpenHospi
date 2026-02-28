import { ArrowLeft } from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

import { getReportDetail, getRoomDetail, getUserDetail } from "../../actions";
import { ReportActions } from "./report-actions-client";
import { RoomDetailDialog } from "./room-detail-dialog";
import { UserDetailDialog } from "./user-detail-dialog";

type Props = {
  params: Promise<{ locale: string; reportId: string }>;
};

export default async function ReportDetailPage({ params }: Props) {
  const { locale, reportId } = await params;
  setRequestLocale(locale);

  const t = await getTranslations({ locale, namespace: "admin" });
  const tEnums = await getTranslations({ locale, namespace: "enums" });

  const report = await getReportDetail(reportId);
  if (!report) notFound();

  const [roomDetail, userDetail] = await Promise.all([
    report.reportedRoomId ? getRoomDetail(report.reportedRoomId) : null,
    report.reportedUserId ? getUserDetail(report.reportedUserId) : null,
  ]);

  const isPending = report.status === "pending" || report.status === "reviewing";

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/${locale}/admin/reports`}>
            <ArrowLeft className="size-5" />
            <span className="sr-only">{t("reports.backToList")}</span>
          </Link>
        </Button>
        <h1 className="text-3xl font-bold tracking-tight">{t("reports.detailTitle")}</h1>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{t("reports.details")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-muted-foreground text-sm">{t("reports.colStatus")}</p>
              <Badge>{tEnums(`report_status.${report.status}`)}</Badge>
            </div>
            <div>
              <p className="text-muted-foreground text-sm">{t("reports.colReason")}</p>
              <p className="font-medium">{tEnums(`report_reason.${report.reason}`)}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-sm">{t("reports.colReporter")}</p>
              <p className="font-medium">{report.reporterName}</p>
            </div>
            {report.reportedUserId && (
              <div>
                <p className="text-muted-foreground text-sm">{t("reports.reportedUser")}</p>
                {userDetail ? (
                  <UserDetailDialog user={userDetail}>
                    <button className="text-primary hover:underline cursor-pointer font-medium">
                      {report.reportedUserName ?? "Unknown"}
                      {report.reportedUserBanned && (
                        <Badge variant="destructive" className="ml-2">{t("reports.banned")}</Badge>
                      )}
                    </button>
                  </UserDetailDialog>
                ) : (
                  <p className="font-medium">
                    {report.reportedUserName ?? "Unknown"}
                    {report.reportedUserBanned && (
                      <Badge variant="destructive" className="ml-2">{t("reports.banned")}</Badge>
                    )}
                  </p>
                )}
              </div>
            )}
            {report.reportedRoomId && (
              <div>
                <p className="text-muted-foreground text-sm">{t("reports.reportedRoom")}</p>
                {roomDetail ? (
                  <RoomDetailDialog room={roomDetail}>
                    <button className="text-primary hover:underline cursor-pointer font-medium">
                      {roomDetail.title}
                    </button>
                  </RoomDetailDialog>
                ) : (
                  <p className="font-mono text-sm">{report.reportedRoomId}</p>
                )}
              </div>
            )}
            <div>
              <p className="text-muted-foreground text-sm">{t("reports.colDate")}</p>
              <p className="font-medium">{report.createdAt.toLocaleString()}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("reports.content")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {report.description && (
              <div>
                <p className="text-muted-foreground text-sm">{t("reports.userDescription")}</p>
                <p className="mt-1 whitespace-pre-wrap">{report.description}</p>
              </div>
            )}
            {report.decryptedMessageText && (
              <div>
                <p className="text-muted-foreground text-sm">{t("reports.reportedMessage")}</p>
                <div className="bg-muted mt-1 rounded-md p-3">
                  <p className="text-sm whitespace-pre-wrap">{report.decryptedMessageText}</p>
                </div>
              </div>
            )}
            {!report.description && !report.decryptedMessageText && (
              <p className="text-muted-foreground">{t("reports.noContent")}</p>
            )}
          </CardContent>
        </Card>
      </div>

      {isPending && (
        <>
          <Separator />
          <ReportActions
            reportId={report.id}
            reportedUserId={report.reportedUserId}
            reportedRoomId={report.reportedRoomId}
            reportedUserBanned={report.reportedUserBanned ?? false}
          />
        </>
      )}

      {report.resolvedAt && (
        <Card>
          <CardHeader>
            <CardTitle>{t("reports.resolution")}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-sm">
              {t("reports.resolvedAt", { date: report.resolvedAt.toLocaleString() })}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
