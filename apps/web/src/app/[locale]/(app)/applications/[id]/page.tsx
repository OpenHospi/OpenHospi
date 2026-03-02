import { isTerminalApplicationStatus } from "@openhospi/shared/enums";
import { Camera, Home } from "lucide-react";
import type { Metadata } from "next";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { InvitationCard } from "@/app/[locale]/(app)/invitations/invitation-card";
import { StorageImage } from "@/components/storage-image";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Link, redirect } from "@/i18n/navigation-app";
import { routing } from "@/i18n/routing";
import { getApplicationDetail } from "@/lib/applications";
import { requireSession } from "@/lib/auth-server";
import { getInvitationForApplication } from "@/lib/invitations";
import { APPLICATION_STATUS_COLORS } from "@/lib/status-colors";
import { cn } from "@/lib/utils";

import { WithdrawButton } from "./withdraw-button";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) return {};
  const t = await getTranslations({ locale, namespace: "app.applications" });
  return { title: t("detailTitle") };
}

type Props = {
  params: Promise<{ locale: string; id: string }>;
};

export default async function ApplicationDetailPage({ params }: Props) {
  const { locale, id } = await params;
  if (!hasLocale(routing.locales, locale)) return null;
  setRequestLocale(locale);
  const { user } = await requireSession();

  const application = await getApplicationDetail(id, user.id);
  if (!application) {
    return redirect({ href: "/applications", locale });
  }

  const invitation = await getInvitationForApplication(id, user.id);

  const t = await getTranslations({ locale, namespace: "app.applications" });
  const tCommon = await getTranslations({ locale, namespace: "common.labels" });
  const tEnums = await getTranslations({ locale, namespace: "enums" });

  const isTerminal = isTerminalApplicationStatus(application.status);
  const appliedDate = new Date(application.appliedAt).toLocaleDateString();

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Room info card */}
      <Card>
        <div className="flex flex-col sm:flex-row">
          <div className="relative aspect-video w-full shrink-0 bg-muted sm:aspect-square sm:w-48">
            {application.roomCoverPhotoUrl ? (
              <StorageImage
                src={application.roomCoverPhotoUrl}
                alt={application.roomTitle}
                bucket="room-photos"
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
              {tEnums(`city.${application.roomCity}` as any)}
            </p>
            <p className="mt-2 text-lg font-bold">
              €{application.roomRentPrice}
              <span className="text-sm font-normal text-muted-foreground">/mo</span>
            </p>
            <div className="mt-3 flex flex-wrap gap-2 text-sm text-muted-foreground">
              {application.roomHouseType && (
                <span>{tEnums(`house_type.${application.roomHouseType}` as any)}</span>
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

      {/* Status section */}
      <Card>
        <CardHeader>
          <CardTitle>{t("statusTitle")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3">
            <Badge className={cn("text-sm", APPLICATION_STATUS_COLORS[application.status])}>
              {tEnums(`application_status.${application.status}` as any)}
            </Badge>
            <span className="text-sm text-muted-foreground">
              {t("appliedOn", { date: appliedDate })}
            </span>
          </div>

          {!isTerminal && (
            <>
              <Separator />
              <WithdrawButton applicationId={application.id} />
            </>
          )}
        </CardContent>
      </Card>

      {/* Event invitation */}
      {invitation && (
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-muted-foreground">{t("eventInvitation")}</h3>
          <p className="text-sm text-muted-foreground">{t("eventInvitationDescription")}</p>
          <InvitationCard invitation={invitation} />
        </div>
      )}

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
    </div>
  );
}
