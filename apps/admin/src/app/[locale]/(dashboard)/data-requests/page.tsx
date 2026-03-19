import type { Locale } from "@openhospi/i18n";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { Main } from "@/components/main";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { routing } from "@/i18n/routing";

import { getDataRequests, getDataRequestStats } from "../data-request-actions";

import { DataRequestsTable } from "./data-requests-table";

type Props = {
  params: Promise<{ locale: Locale }>;
};

export default async function AdminDataRequestsPage({ params }: Props) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) return null;
  setRequestLocale(locale);

  const t = await getTranslations({ locale, namespace: "admin.dataRequests" });

  const [requests, stats] = await Promise.all([getDataRequests(), getDataRequestStats()]);

  return (
    <Main className="gap-4 sm:gap-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">{t("title")}</h2>
        <p className="text-muted-foreground">{t("description")}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t("stats.pending")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pending}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t("stats.inProgress")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.inProgress}</div>
          </CardContent>
        </Card>
      </div>

      <div className="-mx-4 flex-1 overflow-auto px-4 py-1">
        <DataRequestsTable data={requests} />
      </div>
    </Main>
  );
}
