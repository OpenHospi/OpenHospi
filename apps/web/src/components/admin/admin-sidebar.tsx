"use client";

import { BarChart3, ClipboardList, Home, ScrollText, ShieldCheck } from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { ThemeToggle } from "@/components/theme-toggle";
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
  SidebarSeparator,
} from "@/components/ui/sidebar";

type Props = {
  user: { name: string };
};

export function AdminSidebar({ user }: Props) {
  const t = useTranslations("admin.sidebar");
  const pathname = usePathname();

  // Strip locale prefix from pathname for matching
  const pathWithoutLocale = pathname.replace(/^\/[a-z]{2}/, "");

  const navItems = [
    { label: t("dashboard"), href: "/admin", icon: BarChart3 },
    { label: t("reports"), href: "/admin/reports", icon: ClipboardList },
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
        <div className="flex items-center gap-1 px-2">
          <ThemeToggle />
        </div>
        <SidebarSeparator />
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <Link href="/discover">
                <Home className="size-4" />
                <span>{t("backToApp")}</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
        <p className="text-muted-foreground truncate px-3 pb-2 text-xs">{user.name}</p>
      </SidebarFooter>
    </Sidebar>
  );
}
