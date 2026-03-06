"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { useFormatter, useTranslations } from "next-intl";

import { DataTableColumnHeader } from "@/components/admin/data-table";
import { Badge } from "@/components/ui/badge";

import type { AuditLogEntry } from "../actions";

export function useAuditLogColumns(): ColumnDef<AuditLogEntry>[] {
  const tEnums = useTranslations("enums");
  const t = useTranslations("admin.auditLog");
  const format = useFormatter();

  return [
    {
      accessorKey: "createdAt",
      header: ({ column }) => <DataTableColumnHeader column={column} title={t("colTimestamp")} />,
      cell: ({ row }) => (
        <span className="text-muted-foreground whitespace-nowrap">
          {format.dateTime(row.getValue("createdAt"), "dateTime")}
        </span>
      ),
    },
    {
      accessorKey: "adminName",
      header: ({ column }) => <DataTableColumnHeader column={column} title={t("colAdmin")} />,
      cell: ({ row }) => <span>{row.getValue("adminName")}</span>,
    },
    {
      accessorKey: "action",
      header: ({ column }) => <DataTableColumnHeader column={column} title={t("colAction")} />,
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Badge variant="outline">
            {tEnums(
              `admin_action.${row.getValue("action") as string}` as Parameters<typeof tEnums>[0],
            )}
          </Badge>
          {row.original.targetType && (
            <span className="text-muted-foreground text-xs">{row.original.targetType}</span>
          )}
        </div>
      ),
      filterFn: (row, id, value: string[]) => value.includes(row.getValue(id)),
    },
    {
      accessorKey: "reason",
      header: ({ column }) => <DataTableColumnHeader column={column} title={t("colReason")} />,
      cell: ({ row }) => <span className="max-w-xs truncate">{row.getValue("reason")}</span>,
    },
  ];
}
