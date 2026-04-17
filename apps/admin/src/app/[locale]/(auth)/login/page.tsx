import type { Locale } from "@openhospi/i18n";
import { APP_NAME } from "@openhospi/shared/constants";
import { ShieldCheck } from "lucide-react";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { redirect } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { getSession } from "@/lib/auth/server";

import { LoginButton } from "./login-button";

type Props = {
  params: Promise<{ locale: Locale }>;
};

export default async function AdminLoginPage({ params }: Props) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) return null;
  setRequestLocale(locale);

  const session = await getSession();
  if (session?.session.activeOrganizationId) {
    redirect({ href: "/", locale });
  }

  const t = await getTranslations({ locale, namespace: "admin.login" });

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center p-4">
      <div className="mb-6 flex items-center gap-2">
        <ShieldCheck className="text-primary size-7" />
        <span className="text-xl font-semibold tracking-tight">
          {APP_NAME} <span className="text-muted-foreground font-normal">Admin</span>
        </span>
      </div>

      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">{t("title")}</CardTitle>
          <CardDescription>{t("description")}</CardDescription>
        </CardHeader>
        <CardContent>
          <LoginButton />
        </CardContent>
      </Card>

      <p className="text-muted-foreground mt-6 text-center text-sm">{t("footer")}</p>
    </div>
  );
}
