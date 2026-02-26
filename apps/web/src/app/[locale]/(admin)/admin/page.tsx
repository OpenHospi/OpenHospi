import { APP_NAME } from "@openhospi/shared/constants";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { requireAdmin } from "@/lib/auth-server";

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function AdminPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  await requireAdmin();

  const t = await getTranslations({ locale, namespace: "admin" });

  return (
    <div className="text-center">
      <h1 className="text-3xl font-bold">{APP_NAME} — Admin</h1>
      <p className="mt-4 text-muted-foreground">{t("comingSoon")}</p>
    </div>
  );
}
