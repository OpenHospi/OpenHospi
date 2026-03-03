"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { useFormatter, useTranslations } from "next-intl";

import { DataTableColumnHeader } from "@/components/data-table";
import { Badge } from "@/components/ui/badge";

import type { DataRequestListItem } from "../data-request-actions";

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  in_progress: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  completed: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  denied: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
};

export function useDataRequestsColumns(): ColumnDef<DataRequestListItem>[] {
  const t = useTranslations("admin.dataRequests");
  const format = useFormatter();

  return [
    {
      accessorKey: "userName",
      header: ({ column }) => <DataTableColumnHeader column={column} title={t("colUser")} />,
      cell: ({ row }) => (
        <div>
          <span className="font-medium">{row.original.userName}</span>
          <p className="text-xs text-muted-foreground">{row.original.userEmail}</p>
        </div>
      ),
    },
    {
      accessorKey: "type",
      header: ({ column }) => <DataTableColumnHeader column={column} title={t("colType")} />,
      cell: ({ row }) => (
        <Badge variant="outline">
          {t(`types.${row.getValue("type") as string}` as Parameters<typeof t>[0])}
        </Badge>
      ),
      filterFn: (row, id, value: string[]) => value.includes(row.getValue(id)),
    },
    {
      accessorKey: "status",
      header: ({ column }) => <DataTableColumnHeader column={column} title={t("colStatus")} />,
      cell: ({ row }) => (
        <Badge className={STATUS_COLORS[row.getValue("status") as string] ?? ""}>
          {t(`statuses.${row.getValue("status") as string}` as Parameters<typeof t>[0])}
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
