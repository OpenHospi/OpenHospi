import {ReportStatus, ReportType} from "@openhospi/shared/enums";
import Link from "next/link";
import {getTranslations, setRequestLocale} from "next-intl/server";

import {Badge} from "@/components/ui/badge";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {Tabs, TabsList, TabsTrigger} from "@/components/ui/tabs";

import {getReports} from "../actions";

type Props = {
    params: Promise<{ locale: string }>;
    searchParams: Promise<{ status?: string; type?: string }>;
};

const STATUS_COLORS: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
    reviewing: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
    resolved: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
    dismissed: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200",
};

const TYPE_COLORS: Record<string, string> = {
    message: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
    user: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
    room: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
};

export default async function AdminReportsPage({params, searchParams}: Props) {
    const {locale} = await params;
    const {status, type} = await searchParams;
    setRequestLocale(locale);

    const t = await getTranslations({locale, namespace: "admin"});
    const tEnums = await getTranslations({locale, namespace: "enums"});

    const filterStatus = status && ReportStatus.values.includes(status as ReportStatus)
        ? (status as ReportStatus)
        : ReportStatus.values[0];

    const filterType = type && ReportType.values.includes(type as ReportType)
        ? (type as ReportType)
        : undefined;

    const allReports = await getReports(filterStatus, filterType);

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">{t("reports.title")}</h1>
                <p className="text-muted-foreground">{t("reports.description")}</p>
            </div>

            <div className="space-y-4">
                <div>
                    <h3 className="text-sm font-semibold mb-3">{t("reports.filterByStatus")}</h3>
                    <Tabs defaultValue={filterStatus} value={filterStatus}>
                        <TabsList>
                            {ReportStatus.values.map((s) => {
                                const typeParam = filterType ? `&type=${filterType}` : "";
                                return (
                                    <TabsTrigger key={s} value={s} asChild>
                                        <Link href={`/admin/reports?status=${s}${typeParam}`}>
                                            {tEnums(`report_status.${s}`)}
                                        </Link>
                                    </TabsTrigger>
                                );
                            })}
                        </TabsList>
                    </Tabs>
                </div>

                <div>
                    <h3 className="text-sm font-semibold mb-3">{t("reports.filterByType")}</h3>
                    <div className="flex flex-wrap gap-2">
                        <Link
                            href={`/admin/reports?status=${filterStatus}`}
                            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                                !filterType
                                    ? "bg-primary text-primary-foreground"
                                    : "bg-muted text-muted-foreground hover:bg-accent"
                            }`}
                        >
                            {t("reports.allTypes")}
                        </Link>
                        {ReportType.values.map((t_) => (
                            <Link
                                key={t_}
                                href={`/admin/reports?status=${filterStatus}&type=${t_}`}
                                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                                    filterType === t_
                                        ? "bg-primary text-primary-foreground"
                                        : "bg-muted text-muted-foreground hover:bg-accent"
                                }`}
                            >
                                {tEnums(`report_type.${t_}`)}
                            </Link>
                        ))}
                    </div>
                </div>
            </div>

            {allReports.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12">
                    <p className="text-muted-foreground text-center mb-2">{t("reports.empty")}</p>
                    <p className="text-xs text-muted-foreground">
                        {filterType ? t("reports.emptyWithTypeFilter") : t("reports.emptyWithStatusFilter")}
                    </p>
                </div>
            ) : (
                <div className="rounded-lg border overflow-hidden">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-24">{t("reports.colType")}</TableHead>
                                <TableHead>{t("reports.colReporter")}</TableHead>
                                <TableHead>{t("reports.colReason")}</TableHead>
                                <TableHead className="w-32">{t("reports.colStatus")}</TableHead>
                                <TableHead className="w-32 text-right">{t("reports.colDate")}</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {allReports.map((report) => (
                                <TableRow key={report.id}
                                          className="hover:bg-muted/50 cursor-pointer transition-colors">
                                    <TableCell>
                                        <Link href={`/admin/reports/${report.id}`} className="block">
                                            <Badge className={TYPE_COLORS[report.reportType] ?? ""}>
                                                {tEnums(`report_type.${report.reportType}`)}
                                            </Badge>
                                        </Link>
                                    </TableCell>
                                    <TableCell>
                                        <Link
                                            href={`/admin/reports/${report.id}`}
                                            className="text-primary hover:underline font-medium"
                                        >
                                            {report.reporterName}
                                        </Link>
                                    </TableCell>
                                    <TableCell>
                                        <Link
                                            href={`/admin/reports/${report.id}`}
                                            className="text-primary hover:underline"
                                        >
                                            {tEnums(`report_reason.${report.reason}`)}
                                        </Link>
                                    </TableCell>
                                    <TableCell>
                                        <Link href={`/admin/reports/${report.id}`} className="block">
                                            <Badge className={STATUS_COLORS[report.status] ?? ""}>
                                                {tEnums(`report_status.${report.status}`)}
                                            </Badge>
                                        </Link>
                                    </TableCell>
                                    <TableCell className="text-right text-sm text-muted-foreground">
                                        <Link
                                            href={`/admin/reports/${report.id}`}
                                            className="text-primary hover:underline"
                                        >
                                            {report.createdAt.toLocaleDateString(locale, {
                                                year: "numeric",
                                                month: "short",
                                                day: "numeric",
                                            })}
                                        </Link>
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
