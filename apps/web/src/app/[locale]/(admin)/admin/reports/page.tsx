import {REPORT_STATUSES} from "@openhospi/shared/enums";
import type {ReportStatus} from "@openhospi/shared/enums";
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
    searchParams: Promise<{ status?: string }>;
};

const STATUS_COLORS: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
    reviewing: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
    resolved: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
    dismissed: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200",
};

export default async function AdminReportsPage({params, searchParams}: Props) {
    const {locale} = await params;
    const {status} = await searchParams;
    setRequestLocale(locale);

    const t = await getTranslations({locale, namespace: "admin"});
    const tEnums = await getTranslations({locale, namespace: "enums"});

    const filterStatus = status && REPORT_STATUSES.includes(status as ReportStatus)
        ? (status as ReportStatus)
        : REPORT_STATUSES[0]; // Default to first status (pending)

    const allReports = await getReports(filterStatus);

    function getReportType(report: typeof allReports[number]): string {
        if (report.reportedMessageId) return t("reports.typeMessage");
        if (report.reportedRoomId) return t("reports.typeRoom");
        if (report.reportedUserId) return t("reports.typeUser");
        return t("reports.typeUnknown");
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">{t("reports.title")}</h1>
                <p className="text-muted-foreground">{t("reports.description")}</p>
            </div>

            <Tabs defaultValue={filterStatus} value={filterStatus}>
                <TabsList>
                    {REPORT_STATUSES.map((s) => (
                        <TabsTrigger key={s} value={s} asChild>
                            <Link href={`/admin/reports?status=${s}`}>
                                {tEnums(`report_status.${s}`)}
                            </Link>
                        </TabsTrigger>
                    ))}
                </TabsList>
            </Tabs>

            {allReports.length === 0 ? (
                <div className="flex items-center justify-center rounded-lg border border-dashed p-12">
                    <p className="text-muted-foreground">{t("reports.empty")}</p>
                </div>
            ) : (
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>{t("reports.colType")}</TableHead>
                            <TableHead>{t("reports.colReporter")}</TableHead>
                            <TableHead>{t("reports.colReason")}</TableHead>
                            <TableHead>{t("reports.colStatus")}</TableHead>
                            <TableHead>{t("reports.colDate")}</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {allReports.map((report) => (
                            <TableRow key={report.id}>
                                <TableCell>
                                    <Link
                                        href={`/admin/reports/${report.id}`}
                                        className="text-primary hover:underline"
                                    >
                                        {getReportType(report)}
                                    </Link>
                                </TableCell>
                                <TableCell>{report.reporterName}</TableCell>
                                <TableCell>{tEnums(`report_reason.${report.reason}`)}</TableCell>
                                <TableCell>
                                    <Badge className={STATUS_COLORS[report.status] ?? ""}>
                                        {tEnums(`report_status.${report.status}`)}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-muted-foreground">
                                    {report.createdAt.toLocaleDateString()}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            )}
        </div>
    );
}
