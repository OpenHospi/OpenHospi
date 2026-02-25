import { Home } from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import { redirect } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Link } from "@/i18n/navigation-app";
import { getApplicationDetail } from "@/lib/applications";
import { requireSession } from "@/lib/auth-server";
import { cn } from "@/lib/utils";

import { WithdrawButton } from "./withdraw-button";

const statusColors: Record<string, string> = {
  sent: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  seen: "bg-sky-100 text-sky-800 dark:bg-sky-900 dark:text-sky-200",
  liked: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  maybe: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  rejected: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  invited: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  accepted: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200",
  not_chosen: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  withdrawn: "bg-muted text-muted-foreground",
};

const terminalStatuses = new Set([
  "rejected",
  "accepted",
  "not_chosen",
  "withdrawn",
  "not_attending",
]);

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "app.applications" });
  return { title: t("detailTitle") };
}

type Props = {
  params: Promise<{ locale: string; id: string }>;
};

export default async function ApplicationDetailPage({ params }: Props) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  const { user } = await requireSession();

  const application = await getApplicationDetail(id, user.id);
  if (!application) {
    return redirect("/applications");
  }

  const t = await getTranslations({ locale, namespace: "app.applications" });
  const tEnums = await getTranslations({ locale, namespace: "enums" });

  const isTerminal = terminalStatuses.has(application.status);
  const appliedDate = new Date(application.appliedAt).toLocaleDateString();

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Room info card */}
      <Card>
        <div className="flex flex-col sm:flex-row">
          <div className="relative aspect-video w-full shrink-0 bg-muted sm:aspect-square sm:w-48">
            {application.roomCoverPhotoUrl ? (
              <Image
                src={application.roomCoverPhotoUrl}
                alt={application.roomTitle}
                fill
                className="object-cover sm:rounded-l-lg"
              />
            ) : (
              <div className="flex size-full items-center justify-center">
                <Home className="size-8 text-muted-foreground" />
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
              <span className="text-sm font-normal text-muted-foreground">/mo</span>
            </p>
            <div className="mt-3 flex flex-wrap gap-2 text-sm text-muted-foreground">
              {application.roomHouseType && (
                <span>{tEnums(`house_type.${application.roomHouseType}`)}</span>
              )}
              {application.roomSizeM2 && <span>· {application.roomSizeM2} m²</span>}
              {application.roomTotalHousemates != null && (
                <span>· {t("housemates", { count: application.roomTotalHousemates })}</span>
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
            <Badge className={cn("text-sm", statusColors[application.status])}>
              {tEnums(`application_status.${application.status}`)}
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
