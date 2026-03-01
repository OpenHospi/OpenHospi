import { APP_NAME } from "@openhospi/shared/constants";
import { ShieldCheck } from "lucide-react";
import { redirect } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";


import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getSession } from "@/lib/auth-server";

import { AdminLoginButton } from "./admin-login-button";

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function AdminLoginPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const session = await getSession();
  if ((session?.user as { role?: string } | undefined)?.role === "admin") {
    redirect("/admin");
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
          <AdminLoginButton />
        </CardContent>
      </Card>

      <p className="text-muted-foreground mt-6 text-center text-sm">{t("footer")}</p>
    </div>
  );
}
