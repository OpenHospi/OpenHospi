import { Building2, FileText, MessageCircle, Search } from "lucide-react";

export const APP_NAV_ITEMS = [
  {
    id: "discover",
    label: "app.sidebar.discover",
    href: "/discover" as const,
    icon: Search,
    disabled: false,
  },
  {
    id: "my-rooms",
    label: "app.sidebar.myRooms",
    href: "/my-rooms" as const,
    icon: Building2,
    disabled: false,
  },
  {
    id: "applications",
    label: "app.sidebar.applications",
    href: "/applications" as const,
    icon: FileText,
    disabled: false,
  },
  {
    id: "chat",
    label: "app.sidebar.chat",
    href: "/chat" as const,
    icon: MessageCircle,
    disabled: false,
  },
] as const;
