import type { Locale } from "@openhospi/i18n";
import { STORAGE_BUCKET_ROOM_PHOTOS } from "@openhospi/shared/constants";
import type { ReportStatus } from "@openhospi/shared/enums";
import { ArrowLeft } from "lucide-react";
import { notFound } from "next/navigation";
import { hasLocale } from "next-intl";
import { getFormatter, getTranslations, setRequestLocale } from "next-intl/server";

import { Main } from "@/components/layout";
import { StorageImage } from "@/components/shared/storage-image";
import { UserAvatar } from "@/components/shared/user-avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Link } from "@/i18n/navigation-app";
import { routing } from "@/i18n/routing";

import { getReportDetail, getRoomDetail, getUserDetail } from "../../actions";

import { ReportActions } from "./report-actions-client";
import { ReportStatusSelector } from "./report-status-selector";
import { RoomDetailDialog } from "./room-detail-dialog";
import { UserDetailDialog } from "./user-detail-dialog";

type Props = {
  params: Promise<{ locale: Locale; reportId: string }>;
};

const TYPE_COLORS: Record<string, string> = {
  message: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  user: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  room: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
};

export default async function ReportDetailPage({ params }: Props) {
  const { locale, reportId } = await params;
  if (!hasLocale(routing.locales, locale)) return null;
  setRequestLocale(locale);

  const t = await getTranslations({ locale, namespace: "admin" });
  const tEnums = await getTranslations({ locale, namespace: "enums" });
  const format = await getFormatter();

  const report = await getReportDetail(reportId);
  if (!report) notFound();

  const [roomDetail, userDetail, reporterDetail] = await Promise.all([
    report.reportedRoomId ? getRoomDetail(report.reportedRoomId) : null,
    report.reportedUserId ? getUserDetail(report.reportedUserId) : null,
    report.reporterId ? getUserDetail(report.reporterId) : null,
  ]);

  const isPending = report.status === "pending" || report.status === "reviewing";

  return (
    <Main>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/admin/reports">
              <ArrowLeft className="size-5" />
              <span className="sr-only">{t("reports.backToList")}</span>
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{t("reports.detailTitle")}</h1>
            <Badge className={TYPE_COLORS[report.reportType] ?? ""} style={{ marginTop: "0.5rem" }}>
              {tEnums(`report_type.${report.reportType}`)}
            </Badge>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>{t("reports.details")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-muted-foreground text-sm mb-2">{t("reports.colStatus")}</p>
                <ReportStatusSelector
                  reportId={report.id}
                  currentStatus={report.status as ReportStatus}
                />
              </div>
              <div>
                <p className="text-muted-foreground text-sm">{t("reports.colReason")}</p>
                <p className="font-medium">{tEnums(`report_reason.${report.reason}`)}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-sm mb-2">{t("reports.colReporter")}</p>
                {reporterDetail ? (
                  <UserDetailDialog user={reporterDetail}>
                    <button
                      type="button"
                      className="flex items-center gap-3 w-full text-left p-3 rounded-lg border-2 border-border hover:border-primary hover:bg-accent transition-all duration-200 cursor-pointer group"
                    >
                      <UserAvatar
                        avatarUrl={reporterDetail.avatarUrl}
                        userName={reporterDetail.name}
                        className="group-hover:ring-2 group-hover:ring-primary/20 transition-all"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-foreground group-hover:text-primary transition-colors duration-200">
                          {reporterDetail.name}
                        </p>
                      </div>
                    </button>
                  </UserDetailDialog>
                ) : (
                  <p className="font-medium">{report.reporterName}</p>
                )}
              </div>
              {report.reportedUserId && (
                <div>
                  <p className="text-muted-foreground text-sm mb-2">{t("reports.reportedUser")}</p>
                  {userDetail ? (
                    <UserDetailDialog user={userDetail}>
                      <button
                        type="button"
                        className="flex items-center gap-3 w-full text-left p-3 rounded-lg border-2 border-border hover:border-primary hover:bg-accent transition-all duration-200 cursor-pointer group"
                      >
                        <UserAvatar
                          avatarUrl={userDetail.avatarUrl}
                          userName={userDetail.name}
                          className="group-hover:ring-2 group-hover:ring-primary/20 transition-all"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-foreground group-hover:text-primary transition-colors duration-200">
                            {userDetail.name}
                          </p>
                          {report.reportedUserBanned && (
                            <Badge variant="destructive" className="mt-1">
                              {t("reports.banned")}
                            </Badge>
                          )}
                        </div>
                      </button>
                    </UserDetailDialog>
                  ) : (
                    <p className="font-medium">
                      {report.reportedUserName ?? "Unknown"}
                      {report.reportedUserBanned && (
                        <Badge variant="destructive" className="ml-2">
                          {t("reports.banned")}
                        </Badge>
                      )}
                    </p>
                  )}
                </div>
              )}
              {report.reportedRoomId && (
                <div>
                  <p className="text-muted-foreground text-sm mb-2">{t("reports.reportedRoom")}</p>
                  {roomDetail ? (
                    <RoomDetailDialog room={roomDetail}>
                      <button
                        type="button"
                        className="flex items-start gap-3 w-full text-left p-3 rounded-lg border-2 border-border hover:border-primary hover:bg-accent transition-all duration-200 cursor-pointer group"
                      >
                        {roomDetail.coverPhotoUrl && (
                          <div className="relative size-10 shrink-0 overflow-hidden rounded ring-2 ring-transparent group-hover:ring-primary/20 transition-all">
                            <StorageImage
                              src={roomDetail.coverPhotoUrl}
                              alt={roomDetail.title}
                              bucket={STORAGE_BUCKET_ROOM_PHOTOS}
                              fill
                              className="object-cover"
                            />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-foreground group-hover:text-primary transition-colors duration-200">
                            {roomDetail.title}
                          </p>
                        </div>
                      </button>
                    </RoomDetailDialog>
                  ) : (
                    <p className="font-mono text-sm">{report.reportedRoomId}</p>
                  )}
                </div>
              )}
              <div>
                <p className="text-muted-foreground text-sm">{t("reports.colDate")}</p>
                <p className="font-medium">{format.dateTime(report.createdAt, "dateTime")}</p>
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
                {t("reports.resolvedAt", { date: format.dateTime(report.resolvedAt, "dateTime") })}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </Main>
  );
}
