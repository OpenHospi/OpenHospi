import type { Locale } from "@openhospi/i18n";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { Main } from "@/components/main";
import { routing } from "@/i18n/routing";

import { getReports } from "../actions";

import { ReportsTable } from "./reports-table";

type Props = {
  params: Promise<{ locale: Locale }>;
};

export default async function AdminReportsPage({ params }: Props) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) return null;
  setRequestLocale(locale);

  const t = await getTranslations({ locale, namespace: "admin" });
  const allReports = await getReports();

  return (
    <Main className="gap-4 sm:gap-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">{t("reports.title")}</h2>
        <p className="text-muted-foreground">{t("reports.description")}</p>
      </div>
      <div className="-mx-4 flex-1 overflow-auto px-4 py-1">
        <ReportsTable data={allReports} />
      </div>
    </Main>
  );
}
