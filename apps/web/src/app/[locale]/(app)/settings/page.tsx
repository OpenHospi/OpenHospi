import type { Locale } from "@openhospi/i18n";
import type { Metadata } from "next";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { routing } from "@/i18n/routing";
import { requireSession } from "@/lib/auth-server";

import { SettingsContent } from "./settings-content";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) return {};
  const t = await getTranslations({ locale, namespace: "app.settings" });
  return { title: t("title") };
}

type Props = {
  params: Promise<{ locale: Locale }>;
};

export default async function SettingsPage({ params }: Props) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) return null;
  setRequestLocale(locale);
  await requireSession();
  const t = await getTranslations({ locale, namespace: "app.settings" });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">{t("title")}</h1>
      <SettingsContent />
    </div>
  );
}
