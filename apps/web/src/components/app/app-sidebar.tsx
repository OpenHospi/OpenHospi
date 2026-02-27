"use client";

import { Building2, Calendar, FileText, Home, MessageCircle, Search, Settings, User } from "lucide-react";
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
import { Link, usePathname } from "@/i18n/navigation-app";

import { UserMenu } from "./user-menu";

type AppSidebarProps = {
  user: {
    name: string;
    image?: string | null;
  };
};

export function AppSidebar({ user }: AppSidebarProps) {
  const t = useTranslations("app.sidebar");
  const pathname = usePathname();

  const navItems = [
    {
      label: t("discover"),
      href: "/discover" as const,
      icon: Search,
      disabled: false,
    },
    {
      label: t("myRooms"),
      href: "/my-rooms" as const,
      icon: Building2,
      disabled: false,
    },
    {
      label: t("applications"),
      href: "/applications" as const,
      icon: FileText,
      disabled: false,
    },
    {
      label: t("invitations"),
      href: "/invitations" as const,
      icon: Calendar,
      disabled: false,
    },
    {
      label: t("chat"),
      href: "/chat" as const,
      icon: MessageCircle,
      disabled: false,
    },
    {
      label: t("profile"),
      href: "/profile" as const,
      icon: User,
      disabled: false,
    },
    {
      label: t("settings"),
      href: "/settings" as const,
      icon: Settings,
      disabled: false,
    },
  ];

  return (
    <Sidebar>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href="/discover">
                <div className="bg-primary text-primary-foreground flex size-8 items-center justify-center rounded-md">
                  <Home className="size-4" />
                </div>
                <span className="text-lg font-semibold">OpenHospi</span>
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
                const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
                return (
                  <SidebarMenuItem key={item.href}>
                    {item.disabled ? (
                      <SidebarMenuButton disabled tooltip={t("comingSoon")}>
                        <item.icon />
                        <span>{item.label}</span>
                      </SidebarMenuButton>
                    ) : (
                      <SidebarMenuButton asChild isActive={isActive} tooltip={item.label}>
                        <Link href={item.href}>
                          <item.icon />
                          <span>{item.label}</span>
                        </Link>
                      </SidebarMenuButton>
                    )}
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
            <UserMenu user={user} />
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
