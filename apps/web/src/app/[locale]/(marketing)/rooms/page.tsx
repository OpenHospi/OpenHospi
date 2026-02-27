import { APP_NAME } from "@openhospi/shared/constants";
import { MapPin } from "lucide-react";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "@/i18n/navigation";
import { getCitiesWithRoomCount } from "@/lib/discover";
import { getLoginUrl } from "@/lib/urls";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "public.rooms" });
  return {
    title: `${t("title")} — ${APP_NAME}`,
    description: t("subtitle"),
  };
}

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function RoomsIndexPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const cities = await getCitiesWithRoomCount();
  const t = await getTranslations({ locale, namespace: "public.rooms" });
  const tEnums = await getTranslations({ locale, namespace: "enums" });
  const loginUrl = getLoginUrl();

  return (
    <section className="py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Hero */}
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{t("title")}</h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">{t("subtitle")}</p>
        </div>

        {/* City grid */}
        <div className="mx-auto mt-16 grid max-w-5xl gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {cities.map(({ city, count }) => (
            <Link key={city} href={`/rooms/${city}`}>
              <Card className="transition-shadow hover:shadow-md">
                <CardContent className="flex items-center gap-3 p-4">
                  <MapPin className="size-5 text-primary" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold">{tEnums(`city.${city}`)}</p>
                    <p className="text-sm text-muted-foreground">
                      {t("roomsAvailable", { count })}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        {cities.length === 0 && (
          <p className="mt-16 text-center text-muted-foreground">
            {t("roomsAvailable", { count: 0 })}
          </p>
        )}

        {/* CTA */}
        <div className="mt-16 text-center">
          <Button asChild size="lg">
            <a href={loginUrl}>{t("loginToBrowse")}</a>
          </Button>
        </div>
      </div>
    </section>
  );
}
