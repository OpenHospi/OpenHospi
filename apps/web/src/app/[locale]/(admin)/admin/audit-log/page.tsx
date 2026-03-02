import type { Locale } from "@openhospi/i18n";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { routing } from "@/i18n/routing";

import { getAuditLog } from "../actions";

type Props = {
  params: Promise<{ locale: Locale }>;
  searchParams: Promise<{ page?: string }>;
};

export default async function AuditLogPage({ params, searchParams }: Props) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) return null;
  const { page: pageParam } = await searchParams;
  setRequestLocale(locale);

  const t = await getTranslations({ locale, namespace: "admin" });
  const tEnums = await getTranslations({ locale, namespace: "enums" });

  const page = Math.max(1, Number(pageParam) || 1);
  const { entries, total } = await getAuditLog(page);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{t("auditLog.title")}</h1>
        <p className="text-muted-foreground">{t("auditLog.description")}</p>
      </div>

      {entries.length === 0 ? (
        <div className="flex items-center justify-center rounded-lg border border-dashed p-12">
          <p className="text-muted-foreground">{t("auditLog.empty")}</p>
        </div>
      ) : (
        <>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("auditLog.colTimestamp")}</TableHead>
                <TableHead>{t("auditLog.colAdmin")}</TableHead>
                <TableHead>{t("auditLog.colAction")}</TableHead>
                <TableHead>{t("auditLog.colReason")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {entries.map((entry) => (
                <TableRow key={entry.id}>
                  <TableCell className="text-muted-foreground whitespace-nowrap">
                    {entry.createdAt.toLocaleString()}
                  </TableCell>
                  <TableCell>{entry.adminName}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{tEnums(`admin_action.${entry.action}`)}</Badge>
                    {entry.targetType && (
                      <span className="text-muted-foreground ml-2 text-xs">{entry.targetType}</span>
                    )}
                  </TableCell>
                  <TableCell className="max-w-xs truncate">{entry.reason}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <p className="text-muted-foreground text-sm">{t("auditLog.total", { count: total })}</p>
        </>
      )}
    </div>
  );
}
