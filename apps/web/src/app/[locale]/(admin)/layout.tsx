import { notFound } from "next/navigation";
import { hasLocale } from "next-intl";
import { setRequestLocale } from "next-intl/server";

import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { AppLanguageSwitcher } from "@/components/app/app-language-switcher";
import { ThemeToggle } from "@/components/theme-toggle";
import { Separator } from "@/components/ui/separator";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
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
      <SidebarInset className="@container/content">
        <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 data-[orientation=vertical]:h-4" />
          </div>
          <div className="ml-auto flex items-center gap-2 px-4">
            <AppLanguageSwitcher />
            <ThemeToggle />
          </div>
        </header>
        <main className="flex flex-1 flex-col overflow-auto">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
