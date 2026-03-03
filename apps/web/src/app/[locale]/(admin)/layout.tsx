import { notFound } from "next/navigation";
import { hasLocale } from "next-intl";
import { setRequestLocale } from "next-intl/server";

import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { AppLanguageSwitcher } from "@/components/app/app-language-switcher";
import { Breadcrumbs, Header } from "@/components/layout";
import { ThemeToggle } from "@/components/theme-toggle";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { routing } from "@/i18n/routing";
import { requireAdmin } from "@/lib/auth-server";

type Props = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
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
      <SidebarInset className="has-data-[layout=fixed]:h-svh @container/content">
        <Header
          fixed
          actions={
            <>
              <AppLanguageSwitcher />
              <ThemeToggle />
            </>
          }
        >
          <Breadcrumbs />
        </Header>
        {children}
      </SidebarInset>
    </SidebarProvider>
  );
}
