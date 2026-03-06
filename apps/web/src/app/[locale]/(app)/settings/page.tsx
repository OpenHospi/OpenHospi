import type { Locale } from "@openhospi/i18n";
import type { Metadata } from "next";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { Separator } from "@/components/ui/separator";
import { routing } from "@/i18n/routing";
import { requireSession } from "@/lib/auth/server";

import { SettingsTabs } from "./settings-tabs";

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
    <div className="flex flex-1 flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t("title")}</h1>
        <p className="text-muted-foreground">{t("description")}</p>
      </div>
      <Separator />
      <SettingsTabs />
    </div>
  );
}
