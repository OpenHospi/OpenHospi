import type { Locale } from "@openhospi/i18n";
import { BarChart3, Building2, Flag, UserCheck, UserPlus, Users } from "lucide-react";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { routing } from "@/i18n/routing";

import { getAggregateStats } from "./actions";

type Props = {
  params: Promise<{ locale: Locale }>;
};

export default async function AdminDashboardPage({ params }: Props) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) return null;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "admin" });
  const tEnums = await getTranslations({ locale, namespace: "enums" });

  const stats = await getAggregateStats();

  const statCards = [
    { label: t("stats.totalUsers"), value: stats.totalUsers, icon: Users },
    { label: t("stats.activeUsers7d"), value: stats.activeUsers7d, icon: UserCheck },
    { label: t("stats.activeUsers30d"), value: stats.activeUsers30d, icon: UserCheck },
    { label: t("stats.newSignupsWeek"), value: stats.newSignupsWeek, icon: UserPlus },
    { label: t("stats.activeListings"), value: stats.activeListings, icon: Building2 },
    { label: t("stats.pendingReports"), value: stats.pendingReports, icon: Flag },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{t("dashboard")}</h1>
        <p className="text-muted-foreground">{t("dashboardDescription")}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {statCards.map((stat) => (
          <Card key={stat.label}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.label}</CardTitle>
              <stat.icon className="text-muted-foreground size-4" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {stats.listingsByCity.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="size-5" />
              {t("stats.listingsByCity")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {stats.listingsByCity.map((row) => (
                <div key={row.city} className="flex items-center justify-between">
                  <span className="text-sm">{tEnums(`city.${row.city}`)}</span>
                  <span className="text-muted-foreground text-sm font-medium">{row.count}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
