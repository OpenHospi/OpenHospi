import type { Locale } from "@openhospi/i18n";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { Main } from "@/components/layout";
import { routing } from "@/i18n/routing";

import { getAuditLog } from "../actions";

import { AuditLogTable } from "./audit-log-table";

type Props = {
  params: Promise<{ locale: Locale }>;
};

export default async function AuditLogPage({ params }: Props) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) return null;
  setRequestLocale(locale);

  const t = await getTranslations({ locale, namespace: "admin" });

  // Fetch all entries (no server-side pagination — client handles it via TanStack Table)
  const { entries } = await getAuditLog(1, 1000);

  return (
    <Main fixed className="flex flex-col gap-4 sm:gap-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">{t("auditLog.title")}</h2>
        <p className="text-muted-foreground">{t("auditLog.description")}</p>
      </div>
      <div className="-mx-4 flex-1 overflow-auto px-4 py-1">
        <AuditLogTable data={entries} />
      </div>
    </Main>
  );
}
