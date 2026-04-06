import { BarChart3, ClipboardList, FileText, ImageOff, ScrollText } from "lucide-react";

export const ADMIN_NAV_ITEMS = [
  {
    id: "dashboard",
    label: "admin.sidebar.dashboard",
    href: "/" as const,
    icon: BarChart3,
  },
  {
    id: "reports",
    label: "admin.sidebar.reports",
    href: "/reports" as const,
    icon: ClipboardList,
  },
  {
    id: "image-review",
    label: "admin.sidebar.imageReview",
    href: "/image-review" as const,
    icon: ImageOff,
  },
  {
    id: "data-requests",
    label: "admin.sidebar.dataRequests",
    href: "/data-requests" as const,
    icon: FileText,
  },
  {
    id: "audit-log",
    label: "admin.sidebar.auditLog",
    href: "/audit-log" as const,
    icon: ScrollText,
  },
] as const;
