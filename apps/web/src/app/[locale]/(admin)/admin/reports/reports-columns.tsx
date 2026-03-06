"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { useFormatter, useTranslations } from "next-intl";

import { DataTableColumnHeader } from "@/components/admin/data-table";
import { Badge } from "@/components/ui/badge";

import type { ReportListItem } from "../actions";

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

export function useReportsColumns(): ColumnDef<ReportListItem>[] {
  const tEnums = useTranslations("enums");
  const t = useTranslations("admin.reports");
  const format = useFormatter();

  return [
    {
      accessorKey: "reportType",
      header: ({ column }) => <DataTableColumnHeader column={column} title={t("colType")} />,
      cell: ({ row }) => (
        <Badge className={TYPE_COLORS[row.getValue("reportType") as string] ?? ""}>
          {tEnums(
            `report_type.${row.getValue("reportType") as string}` as Parameters<typeof tEnums>[0],
          )}
        </Badge>
      ),
      filterFn: (row, id, value: string[]) => value.includes(row.getValue(id)),
    },
    {
      accessorKey: "reporterName",
      header: ({ column }) => <DataTableColumnHeader column={column} title={t("colReporter")} />,
      cell: ({ row }) => <span className="font-medium">{row.getValue("reporterName")}</span>,
    },
    {
      accessorKey: "reason",
      header: ({ column }) => <DataTableColumnHeader column={column} title={t("colReason")} />,
      cell: ({ row }) => (
        <span className="max-w-[200px] truncate">
          {tEnums(
            `report_reason.${row.getValue("reason") as string}` as Parameters<typeof tEnums>[0],
          )}
        </span>
      ),
    },
    {
      accessorKey: "status",
      header: ({ column }) => <DataTableColumnHeader column={column} title={t("colStatus")} />,
      cell: ({ row }) => (
        <Badge className={STATUS_COLORS[row.getValue("status") as string] ?? ""}>
          {tEnums(
            `report_status.${row.getValue("status") as string}` as Parameters<typeof tEnums>[0],
          )}
        </Badge>
      ),
      filterFn: (row, id, value: string[]) => value.includes(row.getValue(id)),
    },
    {
      accessorKey: "createdAt",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t("colDate")} className="justify-end" />
      ),
      cell: ({ row }) => (
        <div className="text-right text-muted-foreground">
          {format.dateTime(row.getValue("createdAt"), "short")}
        </div>
      ),
    },
  ];
}
