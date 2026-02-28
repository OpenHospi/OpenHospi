import { Suspense } from "react";
import { setRequestLocale } from "next-intl/server";

import { AppLanguageSwitcher } from "@/components/app/app-language-switcher";
import { AppSidebar } from "@/components/app/app-sidebar";
import { NotificationBell } from "@/components/app/notification-bell";
import { PushNotificationManager } from "@/components/app/push-notification-manager";
import { ThemeToggle } from "@/components/theme-toggle";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { getSession, requireCompleteProfile } from "@/lib/auth-server";

type Props = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

export default async function AppLayout({ children, params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const session = await getSession();

  if (session) {
    await requireCompleteProfile(session.user.id);
  }

  const user = {
    name: session?.user.name || "User",
    image: session?.user.image ?? null,
  };

  return (
    <SidebarProvider>
      <AppSidebar user={user} />
      <SidebarInset>
        <header className="flex h-14 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <div className="ml-auto flex items-center gap-2">
            <AppLanguageSwitcher />
            <ThemeToggle />
            {session && (
              <>
                <PushNotificationManager />
                <Suspense>
                  <NotificationBell userId={session.user.id} />
                </Suspense>
              </>
            )}
          </div>
        </header>
        <main className="flex-1 p-6">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
