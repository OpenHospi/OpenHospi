import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { requireSession } from "@/lib/auth-server";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "app.discover" });
  return { title: t("title") };
}

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function DiscoverPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  await requireSession(locale);

  const t = await getTranslations({ locale, namespace: "app.discover" });

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold tracking-tight">{t("title")}</h1>
      <p className="text-muted-foreground">{t("placeholder")}</p>
    </div>
  );
}
