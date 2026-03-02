import type { Locale } from "@openhospi/i18n";
import { notFound } from "next/navigation";
import { hasLocale } from "next-intl";
import { setRequestLocale } from "next-intl/server";

import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { AppLanguageSwitcher } from "@/components/app/app-language-switcher";
import { ThemeToggle } from "@/components/theme-toggle";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { routing } from "@/i18n/routing";
import { requireAdmin } from "@/lib/auth-server";

type Props = {
  children: React.ReactNode;
  params: Promise<{ locale: Locale }>;
};

export default async function AdminLayout({ children, params }: Props) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  const session = await requireAdmin();

  return (
    <SidebarProvider>
      <AdminSidebar
        user={{ name: session.user.name ?? "Admin", image: session.user.image ?? null }}
      />
      <SidebarInset>
        <header className="flex h-14 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <div className="ml-auto flex items-center gap-2">
            <AppLanguageSwitcher />
            <ThemeToggle />
          </div>
        </header>
        <main className="flex-1 p-6">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
