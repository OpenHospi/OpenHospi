import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { requireSession } from "@/lib/auth-server";

import { SettingsContent } from "./settings-content";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "app.settings" });
  return { title: t("title") };
}

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function SettingsPage({ params }: Props) {
  const { locale } = await params;
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
