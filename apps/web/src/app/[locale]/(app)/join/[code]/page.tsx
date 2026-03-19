import type { Locale } from "@openhospi/i18n";
import { eq } from "drizzle-orm";
import { Home } from "lucide-react";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "@/i18n/navigation-app";
import { routing } from "@/i18n/routing";
import { requireSession } from "@/lib/auth/server";
import { db } from "@openhospi/database";
import { houses } from "@openhospi/database/schema";

import { JoinHouseButton } from "./join-house-button";

type Props = {
  params: Promise<{ locale: Locale; code: string }>;
};

async function getHouseByInviteCode(code: string) {
  const [house] = await db
    .select({ id: houses.id, name: houses.name })
    .from(houses)
    .where(eq(houses.inviteCode, code));
  return house ?? null;
}

export default async function JoinHousePage({ params }: Props) {
  const { locale, code } = await params;
  if (!hasLocale(routing.locales, locale)) return null;
  setRequestLocale(locale);
  await requireSession();

  const t = await getTranslations({ locale, namespace: "app.joinHouse" });
  const tCommon = await getTranslations({ locale, namespace: "common.labels" });

  const house = await getHouseByInviteCode(code);

  if (!house) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center p-4">
        <Card className="w-full max-w-lg text-center">
          <CardHeader>
            <CardTitle>{t("title")}</CardTitle>
            <CardDescription>{t("errors.INVALID_LINK")}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline">
              <Link href="/discover">{tCommon("cancel")}</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-[60vh] items-center justify-center p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-muted">
            <Home className="size-8 text-muted-foreground" />
          </div>
          <CardTitle className="text-2xl">{t("title")}</CardTitle>
          <CardDescription>{t("description", { name: house.name })}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3 rounded-lg border p-4">
            <h3 className="font-semibold">{house.name}</h3>
          </div>

          <div className="flex gap-3">
            <Button asChild variant="outline" className="flex-1">
              <Link href="/discover">{tCommon("cancel")}</Link>
            </Button>
            <div className="flex-1">
              <JoinHouseButton code={code} />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
