"use client";

import { BarChart3, ClipboardList, FileText, ScrollText, ShieldCheck } from "lucide-react";
import { Link, usePathname } from "@/i18n/navigation-app";
import { useTranslations } from "next-intl";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

import { AdminUserMenu } from "./admin-user-menu";

type Props = {
  user: {
    name: string;
    image?: string | null;
  };
};

export function AdminSidebar({ user }: Props) {
  const t = useTranslations("admin.sidebar");
  const pathname = usePathname();

  // Strip locale prefix from pathname for matching
  const pathWithoutLocale = pathname.replace(/^\/[a-z]{2}/, "");

  const navItems = [
    { label: t("dashboard"), href: "/admin", icon: BarChart3 },
    { label: t("reports"), href: "/admin/reports", icon: ClipboardList },
    { label: t("dataRequests"), href: "/admin/data-requests", icon: FileText },
    { label: t("auditLog"), href: "/admin/audit-log", icon: ScrollText },
  ];

  return (
    <Sidebar>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href="/admin">
                <div className="bg-primary text-primary-foreground flex size-8 items-center justify-center rounded-md">
                  <ShieldCheck className="size-4" />
                </div>
                <span className="text-lg font-semibold">Admin</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => {
                const isActive =
                  pathWithoutLocale === item.href ||
                  (item.href !== "/admin" && pathWithoutLocale.startsWith(item.href + "/"));
                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton asChild isActive={isActive} tooltip={item.label}>
                      <Link href={item.href}>
                        <item.icon />
                        <span>{item.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <AdminUserMenu user={user} />
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
