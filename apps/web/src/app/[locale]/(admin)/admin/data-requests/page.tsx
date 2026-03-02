import type { Locale } from "@openhospi/i18n";
import { DataRequestStatus } from "@openhospi/shared/enums";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Link } from "@/i18n/navigation-app";
import { routing } from "@/i18n/routing";

import { getDataRequests, getDataRequestStats } from "../data-request-actions";

type Props = {
  params: Promise<{ locale: Locale }>;
  searchParams: Promise<{ status?: string }>;
};

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  in_progress: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  completed: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  denied: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
};

export default async function AdminDataRequestsPage({ params, searchParams }: Props) {
  const { locale } = await params;
  const { status } = await searchParams;
  if (!hasLocale(routing.locales, locale)) return null;
  setRequestLocale(locale);

  const t = await getTranslations({ locale, namespace: "admin.dataRequests" });

  const filterStatus =
    status && DataRequestStatus.values.includes(status as DataRequestStatus)
      ? (status as DataRequestStatus)
      : undefined;

  const [requests, stats] = await Promise.all([
    getDataRequests(filterStatus),
    getDataRequestStats(),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{t("title")}</h1>
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

      <div>
        <h3 className="text-sm font-semibold mb-3">{t("filterByStatus")}</h3>
        <Tabs defaultValue={filterStatus ?? "all"} value={filterStatus ?? "all"}>
          <TabsList>
            <TabsTrigger value="all" asChild>
              <Link href="/admin/data-requests">{t("allStatuses")}</Link>
            </TabsTrigger>
            {DataRequestStatus.values.map((s) => (
              <TabsTrigger key={s} value={s} asChild>
                <Link href={`/admin/data-requests?status=${s}`}>{t(`statuses.${s}` as any)}</Link>
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      {requests.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12">
          <p className="text-muted-foreground">{t("empty")}</p>
        </div>
      ) : (
        <div className="rounded-lg border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("colUser")}</TableHead>
                <TableHead className="w-32">{t("colType")}</TableHead>
                <TableHead className="w-32">{t("colStatus")}</TableHead>
                <TableHead className="w-32 text-right">{t("colDate")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {requests.map((request) => (
                <TableRow
                  key={request.id}
                  className="hover:bg-muted/50 cursor-pointer transition-colors"
                >
                  <TableCell>
                    <Link
                      href={`/admin/data-requests/${request.id}`}
                      className="text-primary hover:underline font-medium"
                    >
                      {request.userName}
                    </Link>
                    <p className="text-xs text-muted-foreground">{request.userEmail}</p>
                  </TableCell>
                  <TableCell>
                    <Link href={`/admin/data-requests/${request.id}`} className="block">
                      <Badge variant="outline">{t(`types.${request.type}` as any)}</Badge>
                    </Link>
                  </TableCell>
                  <TableCell>
                    <Link href={`/admin/data-requests/${request.id}`} className="block">
                      <Badge className={STATUS_COLORS[request.status] ?? ""}>
                        {t(`statuses.${request.status}` as any)}
                      </Badge>
                    </Link>
                  </TableCell>
                  <TableCell className="text-right text-sm text-muted-foreground">
                    {request.createdAt.toLocaleDateString(locale, {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
