"use client";

import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";

import { SidebarMenu, SidebarMenuButton, SidebarMenuItem } from "@/components/ui/sidebar";
import { Link } from "@/i18n/navigation-app";
import { isRouteActive } from "@/lib/route-utils";

type NavItem = {
  id: string;
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  disabled?: boolean;
};

type SidebarNavMenuProps = {
  items: readonly NavItem[];
  comingSoonLabel?: string;
};

export function SidebarNavMenu({ items, comingSoonLabel = "Coming soon" }: SidebarNavMenuProps) {
  const t = useTranslations();
  const pathname = usePathname();

  return (
    <SidebarMenu>
      {items.map((item) => {
        const isActive = isRouteActive(pathname, item.href);
        const Icon = item.icon;

        return (
          <SidebarMenuItem key={item.id}>
            {item.disabled ? (
              <SidebarMenuButton disabled tooltip={comingSoonLabel}>
                <Icon className="size-4" />
                <span>{t(item.label as Parameters<typeof t>[0])}</span>
              </SidebarMenuButton>
            ) : (
              <SidebarMenuButton asChild isActive={isActive}>
                <Link href={item.href}>
                  <Icon className="size-4" />
                  <span>{t(item.label as Parameters<typeof t>[0])}</span>
                </Link>
              </SidebarMenuButton>
            )}
          </SidebarMenuItem>
        );
      })}
    </SidebarMenu>
  );
}
