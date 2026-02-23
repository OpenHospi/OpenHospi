"use client";

import { FileText, Home, Search, Settings, User } from "lucide-react";
import { usePathname } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";

import { LanguageSwitcher } from "@/components/marketing/language-switcher";
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
import { Link } from "@/i18n/navigation";

import { UserMenu } from "./user-menu";

type AppSidebarProps = {
  user: {
    name: string;
    image?: string | null;
  };
};

export function AppSidebar({ user }: AppSidebarProps) {
  const t = useTranslations("app.sidebar");
  const locale = useLocale();
  const pathname = usePathname();

  const navItems = [
    {
      label: t("discover"),
      href: "/discover" as const,
      icon: Search,
      disabled: false,
    },
    {
      label: t("applications"),
      href: "/applications" as const,
      icon: FileText,
      disabled: true,
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
      disabled: true,
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
                const isActive = pathname === `/${locale}${item.href}`;
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
        <div className="flex items-center gap-1 px-2">
          <ThemeToggle />
          <LanguageSwitcher />
        </div>
        <SidebarSeparator />
        <SidebarMenu>
          <SidebarMenuItem>
            <UserMenu user={user} />
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
