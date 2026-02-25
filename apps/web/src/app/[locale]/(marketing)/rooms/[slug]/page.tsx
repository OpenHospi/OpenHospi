import { APP_NAME } from "@openhospi/shared/constants";
import { CITIES } from "@openhospi/shared/enums";
import { ArrowLeft, CalendarDays, Home, MapPin, Ruler, Users } from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { PublicRoomCard } from "@/components/marketing/public-room-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Link } from "@/i18n/navigation";
import { getPublicRoom, getPublicRoomsByCity } from "@/lib/discover";
import { getLoginUrl } from "@/lib/urls";

export const dynamic = "force-dynamic";

function isCity(slug: string): boolean {
  return CITIES.includes(slug as (typeof CITIES)[number]);
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;

  if (isCity(slug)) {
    const tEnums = await getTranslations({ locale, namespace: "enums" });
    const t = await getTranslations({ locale, namespace: "public.cityPage" });
    const cityName = tEnums(`city.${slug}`);
    return {
      title: `${t("title", { city: cityName })} — ${APP_NAME}`,
      description: t("subtitle", { city: cityName, count: 0 }),
    };
  }

  const room = await getPublicRoom(slug);
  if (!room) return { title: "Not found" };

  const tEnums = await getTranslations({ locale, namespace: "enums" });
  const cityName = tEnums(`city.${room.city}`);
  const sizeSuffix = room.roomSizeM2 ? ` · ${room.roomSizeM2} m²` : "";
  const title = `${room.title} — ${cityName} — ${APP_NAME}`;
  const description = `€${room.rentPrice}/mo · ${cityName}${sizeSuffix}`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: room.photos[0]?.url ? [{ url: room.photos[0].url }] : [],
    },
  };
}

type Props = {
  params: Promise<{ locale: string; slug: string }>;
};

export default async function RoomSlugPage({ params }: Props) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  if (isCity(slug)) {
    return <CityPage locale={locale} city={slug} />;
  }

  return <RoomDetailPage locale={locale} roomId={slug} />;
}

// ── City Page ────────────────────────────────────────────────────────────────

async function CityPage({ locale, city }: { locale: string; city: string }) {
  const rooms = await getPublicRoomsByCity(city, 6);
  const t = await getTranslations({ locale, namespace: "public.cityPage" });
  const tEnums = await getTranslations({ locale, namespace: "enums" });
  const cityName = tEnums(`city.${city}`);
  const marketingUrl = process.env.NEXT_PUBLIC_MARKETING_URL ?? "https://openhospi.nl";
  const loginUrl = getLoginUrl(locale);

  // Safe: all values come from our DB and i18n — no user-supplied HTML
  const jsonLdScript = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: t("title", { city: cityName }),
    numberOfItems: rooms.length,
    itemListElement: rooms.map((room, i) => ({
      "@type": "ListItem",
      position: i + 1,
      url: `${marketingUrl}/${locale}/rooms/${room.id}`,
    })),
  });

  return (
    <section className="py-24">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdScript }} />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            {t("title", { city: cityName })}
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
            {t("subtitle", { city: cityName, count: rooms.length })}
          </p>
        </div>

        {rooms.length > 0 ? (
          <div className="mt-16">
            <h2 className="mb-6 text-xl font-semibold">{t("featuredRooms")}</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {rooms.map((room) => (
                <PublicRoomCard key={room.id} room={room} />
              ))}
            </div>
          </div>
        ) : (
          <p className="mt-16 text-center text-muted-foreground">{t("noRooms")}</p>
        )}

        <div className="mt-16 flex flex-col items-center gap-4">
          <Button asChild size="lg">
            <a href={loginUrl}>{t("loginCta")}</a>
          </Button>
          <Button variant="ghost" asChild>
            <Link href="/rooms">
              <ArrowLeft className="size-4" />
              {t("browseOtherCities")}
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}

// ── Room Detail Page ─────────────────────────────────────────────────────────

async function RoomDetailPage({ locale, roomId }: { locale: string; roomId: string }) {
  const room = await getPublicRoom(roomId);
  if (!room) notFound();

  const t = await getTranslations({ locale, namespace: "public.room" });
  const loginUrl = getLoginUrl(locale);
  const tEnums = await getTranslations({ locale, namespace: "enums" });

  const cityName = tEnums(`city.${room.city}`);
  const coverPhoto = room.photos[0];
  const otherPhotos = room.photos.slice(1);

  // Safe: all values come from our DB — no user-supplied HTML
  const jsonLdScript = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "Residence",
    name: room.title,
    description: room.description ?? undefined,
    address: {
      "@type": "PostalAddress",
      addressLocality: cityName,
      addressCountry: "NL",
    },
    ...(coverPhoto && { image: coverPhoto.url }),
    offers: {
      "@type": "Offer",
      price: room.rentPrice,
      priceCurrency: "EUR",
      availability: "https://schema.org/InStock",
    },
  });

  return (
    <section className="py-12">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdScript }} />

      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        {/* Photo gallery */}
        {room.photos.length > 0 && (
          <div className="mb-8 space-y-2">
            {coverPhoto && (
              <div className="relative aspect-video overflow-hidden rounded-lg bg-muted">
                <Image
                  src={coverPhoto.url}
                  alt={room.title}
                  fill
                  className="object-cover"
                  priority
                />
              </div>
            )}
            {otherPhotos.length > 0 && (
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
                {otherPhotos.map((photo) => (
                  <div key={photo.id} className="relative aspect-video overflow-hidden rounded-lg bg-muted">
                    <Image src={photo.url} alt={photo.caption ?? room.title} fill className="object-cover" />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Main content */}
          <div className="space-y-6 lg:col-span-2">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">{room.title}</h1>
              <div className="mt-2 flex flex-wrap items-center gap-2 text-muted-foreground">
                <MapPin className="size-4" />
                <span>{cityName}</span>
                {room.neighborhood && <span>· {room.neighborhood}</span>}
              </div>
            </div>

            {/* Quick stats */}
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center gap-1.5">
                <span className="text-2xl font-bold">€{room.rentPrice}</span>
                <span className="text-muted-foreground">{t("perMonth")}</span>
              </div>
              {room.roomSizeM2 && (
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <Ruler className="size-4" />
                  <span>{t("roomSize", { size: room.roomSizeM2 })}</span>
                </div>
              )}
              {room.totalHousemates != null && (
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <Users className="size-4" />
                  <span>{t("housemates", { count: room.totalHousemates })}</span>
                </div>
              )}
              {room.houseType && (
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <Home className="size-4" />
                  <span>{tEnums(`house_type.${room.houseType}`)}</span>
                </div>
              )}
            </div>

            <Separator />

            {/* Description */}
            {room.description && (
              <div>
                <h2 className="text-lg font-semibold">{t("description")}</h2>
                <p className="mt-2 whitespace-pre-line text-muted-foreground">{room.description}</p>
              </div>
            )}

            {/* Details */}
            <div>
              <h2 className="text-lg font-semibold">{t("details")}</h2>
              <dl className="mt-3 grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
                {room.furnishing && (
                  <>
                    <dt className="text-muted-foreground">{tEnums("furnishing_label")}</dt>
                    <dd>{tEnums(`furnishing.${room.furnishing}`)}</dd>
                  </>
                )}
                <dt className="text-muted-foreground">{t("rentalType")}</dt>
                <dd>{tEnums(`rental_type.${room.rentalType}`)}</dd>
                {room.deposit != null && (
                  <>
                    <dt className="text-muted-foreground">{t("deposit")}</dt>
                    <dd>€{room.deposit}</dd>
                  </>
                )}
                <dt className="text-muted-foreground">
                  {room.utilitiesIncluded ? t("utilitiesIncluded") : t("utilitiesExcluded")}
                </dt>
                <dd />
                {room.availableFrom && (
                  <>
                    <dt className="text-muted-foreground">{t("availableFrom", { date: room.availableFrom })}</dt>
                    <dd>
                      {room.availableUntil && t("availableUntil", { date: room.availableUntil })}
                    </dd>
                  </>
                )}
              </dl>
            </div>

            {/* Features */}
            {room.features.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold">{t("features")}</h2>
                <div className="mt-2 flex flex-wrap gap-2">
                  {room.features.map((f) => (
                    <Badge key={f} variant="secondary">
                      {tEnums(`room_feature.${f}`)}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Location tags */}
            {room.locationTags.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold">{t("locationTags")}</h2>
                <div className="mt-2 flex flex-wrap gap-2">
                  {room.locationTags.map((tag) => (
                    <Badge key={tag} variant="outline">
                      {tEnums(`location_tag.${tag}`)}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Preferences */}
            {(room.preferredGender !== "geen_voorkeur" || room.preferredLifestyleTags.length > 0) && (
              <div>
                <h2 className="text-lg font-semibold">{t("preferences")}</h2>
                <div className="mt-2 space-y-2">
                  {room.preferredGender !== "geen_voorkeur" && (
                    <p className="text-sm text-muted-foreground">
                      {tEnums(`gender_preference.${room.preferredGender}`)}
                      {room.preferredAgeMin != null && room.preferredAgeMax != null &&
                        `, ${room.preferredAgeMin}–${room.preferredAgeMax}`}
                    </p>
                  )}
                  {room.preferredLifestyleTags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {room.preferredLifestyleTags.map((tag) => (
                        <Badge key={tag} variant="outline">
                          {tEnums(`lifestyle_tag.${tag}`)}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar CTA */}
          <div className="lg:col-span-1">
            <Card className="sticky top-24">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CalendarDays className="size-5" />
                  €{room.rentPrice}{t("perMonth")}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {room.availableFrom && (
                  <p className="text-sm text-muted-foreground">
                    {t("availableFrom", { date: room.availableFrom })}
                  </p>
                )}
                <Button asChild className="w-full">
                  <a href={loginUrl}>{t("loginToApply")}</a>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
}
