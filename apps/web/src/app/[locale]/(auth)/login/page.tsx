import logo from "@openhospi/shared/assets/logo.svg";
import { APP_NAME } from "@openhospi/shared/constants";
import type { Metadata } from "next";
import Image from "next/image";
import { redirect } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getSession } from "@/lib/auth-server";

import { LoginButton } from "./login-button";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "auth.login" });
  return { title: t("title") };
}

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function LoginPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const session = await getSession();
  if (session) redirect("/discover");

  const t = await getTranslations({ locale, namespace: "auth.login" });

  return (
    <>
      <div className="mb-6 flex items-center justify-center gap-2">
        <Image src={logo} alt="" width={28} height={28} className="size-7" />
        <span className="text-primary text-xl font-semibold tracking-tight">{APP_NAME}</span>
      </div>

      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">{t("title")}</CardTitle>
          <CardDescription>{t("description")}</CardDescription>
        </CardHeader>
        <CardContent>
          <LoginButton />
          <p className="mt-3 text-center text-xs text-muted-foreground">
            {t("surfconextDescription")}
          </p>
        </CardContent>
      </Card>
    </>
  );
}
