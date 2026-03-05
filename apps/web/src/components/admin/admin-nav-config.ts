import { BarChart3, ClipboardList, FileText, ScrollText } from "lucide-react";

export const ADMIN_NAV_ITEMS = [
  {
    id: "dashboard",
    label: "admin.sidebar.dashboard",
    href: "/admin" as const,
    icon: BarChart3,
  },
  {
    id: "reports",
    label: "admin.sidebar.reports",
    href: "/admin/reports" as const,
    icon: ClipboardList,
  },
  {
    id: "data-requests",
    label: "admin.sidebar.dataRequests",
    href: "/admin/data-requests" as const,
    icon: FileText,
  },
  {
    id: "audit-log",
    label: "admin.sidebar.auditLog",
    href: "/admin/audit-log" as const,
    icon: ScrollText,
  },
] as const;
