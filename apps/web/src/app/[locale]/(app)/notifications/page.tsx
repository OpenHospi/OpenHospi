import type { Locale } from "@openhospi/i18n";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { Main } from "@/components/layout";
import { routing } from "@/i18n/routing";
import { requireSession } from "@/lib/auth/server";
import { getUserNotifications } from "@/lib/queries/notifications";

import { NotificationsList } from "./notifications-list";

export async function generateMetadata({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) return {};
  const t = await getTranslations({ locale, namespace: "app.notifications" });
  return { title: t("title") };
}

type Props = {
  params: Promise<{ locale: Locale }>;
};

export default async function NotificationsPage({ params }: Props) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) return null;
  setRequestLocale(locale);
  const { user } = await requireSession();

  const notifications = await getUserNotifications(user.id);

  return (
    <Main className="mx-auto max-w-2xl">
      <div className="space-y-6">
        <h2 className="text-2xl font-bold">
          {(await getTranslations("app.notifications"))("title")}
        </h2>
        <NotificationsList notifications={notifications} />
      </div>
    </Main>
  );
}
