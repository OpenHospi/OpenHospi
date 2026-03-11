import type { Locale } from "@openhospi/i18n";
import { STORAGE_BUCKET_ROOM_PHOTOS } from "@openhospi/shared/constants";
import { isTerminalApplicationStatus } from "@openhospi/shared/enums";
import { Camera, Home } from "lucide-react";
import type { Metadata } from "next";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { SetBreadcrumb } from "@/components/app/breadcrumb-store";
import { StorageImage } from "@/components/shared/storage-image";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link, redirect } from "@/i18n/navigation-app";
import { routing } from "@/i18n/routing";
import { requireSession } from "@/lib/auth/server";
import { getApplicationDetail, getApplicationStatusHistory } from "@/lib/queries/applications";
import { getCalendarToken } from "@/lib/queries/calendar-token";
import { getInvitationForApplication } from "@/lib/queries/invitations";
import { APPLICATION_STATUS_COLORS } from "@/lib/status-colors";
import { cn } from "@/lib/utils";

import { ApplicationTimeline } from "./application-timeline";
import { HospiInvitationCard } from "./hospi-invitation-card";
import { WithdrawButton } from "./withdraw-button";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale; id: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) return {};
  const t = await getTranslations({ locale, namespace: "app.applications" });
  return { title: t("detailTitle") };
}

type Props = {
  params: Promise<{ locale: Locale; id: string }>;
};

export default async function ApplicationDetailPage({ params }: Props) {
  const { locale, id } = await params;
  if (!hasLocale(routing.locales, locale)) return null;
  setRequestLocale(locale);
  const { user } = await requireSession();

  const [application, history, invitation, calendarToken] = await Promise.all([
    getApplicationDetail(id, user.id),
    getApplicationStatusHistory(id, user.id),
    getInvitationForApplication(id, user.id),
    getCalendarToken(),
  ]);

  if (!application) {
    return redirect({ href: "/applications", locale });
  }

  const t = await getTranslations({ locale, namespace: "app.applications" });
  const tCommon = await getTranslations({ locale, namespace: "common.labels" });
  const tEnums = await getTranslations({ locale, namespace: "enums" });

  const isTerminal = isTerminalApplicationStatus(application.status);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <SetBreadcrumb uuid={id} label={application.roomTitle} />
      {/* Room info card */}
      <Card>
        <div className="flex flex-col sm:flex-row">
          <div className="relative aspect-video w-full shrink-0 bg-muted sm:aspect-square sm:w-48">
            {application.roomCoverPhotoUrl ? (
              <StorageImage
                src={application.roomCoverPhotoUrl}
                alt={application.roomTitle}
                bucket={STORAGE_BUCKET_ROOM_PHOTOS}
                fill
                className="object-cover sm:rounded-l-lg"
              />
            ) : (
              <div className="flex size-full items-center justify-center">
                <Home className="size-8 text-muted-foreground" />
              </div>
            )}
            {application.roomPhotoCount > 1 && (
              <div className="absolute bottom-2 right-2 flex items-center gap-1 rounded-md bg-black/60 px-2 py-0.5 text-xs font-medium text-white">
                <Camera className="size-3" />
                {application.roomPhotoCount}
              </div>
            )}
          </div>
          <div className="flex-1 p-4">
            <h2 className="text-xl font-semibold">{application.roomTitle}</h2>
            <p className="text-sm text-muted-foreground">
              {tEnums(`city.${application.roomCity}`)}
            </p>
            <p className="mt-2 text-lg font-bold">
              €{application.roomRentPrice}
              <span className="text-sm font-normal text-muted-foreground">
                {tCommon("perMonth")}
              </span>
            </p>
            <div className="mt-3 flex flex-wrap gap-2 text-sm text-muted-foreground">
              {application.roomHouseType && (
                <span>{tEnums(`house_type.${application.roomHouseType}`)}</span>
              )}
              {application.roomSizeM2 && <span>· {application.roomSizeM2} m²</span>}
              {application.roomTotalHousemates != null && (
                <span>· {tCommon("housemates", { count: application.roomTotalHousemates })}</span>
              )}
            </div>
            <div className="mt-3">
              <Button asChild variant="outline" size="sm">
                <Link href={`/discover/${application.roomId}`}>{t("viewRoom")}</Link>
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* Hospi invitation card — prominent, shown when invited */}
      {invitation && <HospiInvitationCard invitation={invitation} calendarToken={calendarToken} />}

      {/* Timeline card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>{t("timeline.title")}</CardTitle>
            <Badge className={cn("text-sm", APPLICATION_STATUS_COLORS[application.status])}>
              {tEnums(`application_status.${application.status}`)}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <ApplicationTimeline
            history={history}
            appliedAt={application.appliedAt}
            currentStatus={application.status}
            updatedAt={application.updatedAt}
          />
        </CardContent>
      </Card>

      {/* Personal message */}
      {application.personalMessage && (
        <Card>
          <CardHeader>
            <CardTitle>{t("yourMessage")}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-line text-muted-foreground">
              {application.personalMessage}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Withdraw */}
      {!isTerminal && (
        <div className="flex justify-end">
          <WithdrawButton applicationId={application.id} />
        </div>
      )}
    </div>
  );
}
