import { withRLS } from "@openhospi/database";
import { profiles } from "@openhospi/database/schema";
import { PRIVACY_POLICY_VERSION } from "@openhospi/shared/constants";
import { eq } from "drizzle-orm";
import { AlertTriangle } from "lucide-react";
import { notFound } from "next/navigation";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Suspense } from "react";

import { AppLanguageSwitcher } from "@/components/app/app-language-switcher";
import { AppSidebar } from "@/components/app/app-sidebar";
import { NotificationBell } from "@/components/app/notification-bell";
import { Breadcrumbs, Header } from "@/components/layout";
import { ThemeToggle } from "@/components/theme-toggle";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { Link, redirect } from "@/i18n/navigation-app";
import { routing } from "@/i18n/routing";
import { getSession, isRestricted, requireCompleteProfile } from "@/lib/auth-server";

type Props = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

export default async function AppLayout({ children, params }: Props) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  const session = await getSession();
  let restricted = false;
  let avatarUrl: string | null = null;

  if (session) {
    await requireCompleteProfile(session.user.id);

    const [profile] = await withRLS(session.user.id, (tx) =>
      tx
        .select({
          privacyPolicyAcceptedVersion: profiles.privacyPolicyAcceptedVersion,
          avatarUrl: profiles.avatarUrl,
        })
        .from(profiles)
        .where(eq(profiles.id, session.user.id)),
    );

    if (profile?.privacyPolicyAcceptedVersion !== PRIVACY_POLICY_VERSION) {
      redirect({ href: "/privacy-accept", locale });
    }

    avatarUrl = profile?.avatarUrl ?? null;
    restricted = await isRestricted(session.user.id);
  }

  const user = {
    name: session?.user.name || "User",
    avatarUrl,
  };

  return (
    <SidebarProvider>
      <AppSidebar user={user} />
      <SidebarInset className="has-data-[layout=fixed]:h-svh @container/content">
        <Header
          fixed
          actions={
            <>
              <AppLanguageSwitcher />
              <ThemeToggle />
              {session && (
                <Suspense>
                  <NotificationBell userId={session.user.id} />
                </Suspense>
              )}
            </>
          }
        >
          <Breadcrumbs />
        </Header>
        {restricted && <RestrictionBanner />}
        {children}
      </SidebarInset>
    </SidebarProvider>
  );
}

async function RestrictionBanner() {
  const t = await getTranslations("app.restricted");

  return (
    <div className="flex shrink-0 items-center gap-2 border-b border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-200">
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
