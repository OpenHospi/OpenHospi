import type { Locale } from "@openhospi/i18n";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { routing } from "@/i18n/routing";
import { requireSession } from "@/lib/auth-server";

import { createHouse } from "../actions";

type Props = {
  params: Promise<{ locale: Locale }>;
};

export default async function CreateHousePage({ params }: Props) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) return null;
  setRequestLocale(locale);
  await requireSession();

  const t = await getTranslations({ locale, namespace: "app.house" });

  return (
    <div className="flex min-h-[60vh] items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>{t("create.title")}</CardTitle>
          <CardDescription>{t("create.description")}</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={createHouse} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">{t("create.nameLabel")}</Label>
              <Input
                id="name"
                name="name"
                placeholder={t("create.namePlaceholder")}
                required
                minLength={2}
                maxLength={100}
              />
            </div>
            <Button type="submit" className="w-full">
              {t("create.submit")}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
