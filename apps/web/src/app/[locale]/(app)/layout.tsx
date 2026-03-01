import { withRLS } from "@openhospi/database";
import { profiles } from "@openhospi/database/schema";
import { PRIVACY_POLICY_VERSION } from "@openhospi/shared/constants";
import { eq } from "drizzle-orm";
import { AlertTriangle } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Suspense } from "react";

import { AppLanguageSwitcher } from "@/components/app/app-language-switcher";
import { AppSidebar } from "@/components/app/app-sidebar";
import { NotificationBell } from "@/components/app/notification-bell";
import { ThemeToggle } from "@/components/theme-toggle";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { getSession, isRestricted, requireCompleteProfile } from "@/lib/auth-server";

type Props = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

export default async function AppLayout({ children, params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const session = await getSession();
  let restricted = false;

  if (session) {
    await requireCompleteProfile(session.user.id);

    // Check privacy policy version
    const [profile] = await withRLS(session.user.id, (tx) =>
      tx
        .select({ privacyPolicyAcceptedVersion: profiles.privacyPolicyAcceptedVersion })
        .from(profiles)
        .where(eq(profiles.id, session.user.id)),
    );

    if (profile?.privacyPolicyAcceptedVersion !== PRIVACY_POLICY_VERSION) {
      redirect(`/${locale}/privacy-accept`);
    }

    restricted = await isRestricted(session.user.id);
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
              <Suspense>
                <NotificationBell userId={session.user.id} />
              </Suspense>
            )}
          </div>
        </header>
        {restricted && <RestrictionBanner />}
        <main className="flex-1 p-6">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}

async function RestrictionBanner() {
  const t = await getTranslations("app.restricted");

  return (
    <div className="flex items-center gap-2 border-b border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-200">
      <AlertTriangle className="size-4 shrink-0" />
      <span>
        {t("banner")}{" "}
        <Link href="/settings" className="underline underline-offset-4">
          Settings
        </Link>
      </span>
    </div>
  );
}
