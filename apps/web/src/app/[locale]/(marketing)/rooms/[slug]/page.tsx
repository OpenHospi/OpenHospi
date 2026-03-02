import { City } from "@openhospi/shared/enums";
import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { RoomCard } from "@/components/app/room-card";
import { RoomDetailContent } from "@/components/app/room-detail-content";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { getPublicRoom, getPublicRoomsByCity } from "@/lib/discover";
import { publicRoomToDetail } from "@/lib/room-detail";
import { alternatesForPath, breadcrumbJsonLd } from "@/lib/seo";
import { getStoragePublicUrl } from "@/lib/storage-url";
import { getLoginUrl } from "@/lib/urls";

export const dynamic = "force-dynamic";

function isCity(slug: string): boolean {
  return City.values.includes(slug as (typeof City.values)[number]);
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
    const cityName = tEnums(`city.${slug}` as any);
    return {
      title: t("title", { city: cityName }),
      description: t("subtitle", { city: cityName, count: 0 }),
      alternates: alternatesForPath(locale, `/rooms/${slug}`),
    };
  }

  const room = await getPublicRoom(slug);
  if (!room) return { title: "Not found" };

  const tEnums = await getTranslations({ locale, namespace: "enums" });
  const cityName = tEnums(`city.${room.city}` as any);
  const sizeSuffix = room.roomSizeM2 ? ` · ${room.roomSizeM2} m²` : "";
  const title = `${room.title} — ${cityName}`;
  const description = `€${room.totalCost}/mo · ${cityName}${sizeSuffix}`;
  const ogImage = room.photos[0]?.url
    ? getStoragePublicUrl(room.photos[0].url, "room-photos")
    : undefined;

  return {
    title,
    description,
    alternates: alternatesForPath(locale, `/rooms/${slug}`),
    openGraph: {
      title,
      description,
      ...(ogImage && { images: [{ url: ogImage }] }),
    },
    twitter: {
      card: ogImage ? "summary_large_image" : "summary",
      title,
      description,
      ...(ogImage && { images: [ogImage] }),
    },
  };
}

type Props = {
  params: Promise<{ locale: string; slug: string }>;
};

export default async function RoomSlugPage({ params }: Props) {
  const { locale, slug } = await params;
  if (!hasLocale(routing.locales, locale)) return null;
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
  const tSeo = await getTranslations({ locale, namespace: "seo.breadcrumbs" });
  const cityName = tEnums(`city.${city}` as any);
  const marketingUrl = process.env.NEXT_PUBLIC_MARKETING_URL ?? "https://openhospi.nl";
  const loginUrl = getLoginUrl();

  // Safe: JSON-LD from i18n translations and DB, sanitized in seo.ts (per Next.js docs recommendation)
  const breadcrumbs = breadcrumbJsonLd(locale, [
    { name: tSeo("home"), path: "" },
    { name: tSeo("rooms"), path: "/rooms" },
    { name: cityName, path: `/rooms/${city}` },
  ]);

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
      {/* Safe: JSON-LD from i18n translations and DB — no user-supplied HTML */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: breadcrumbs }} />
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
                <Link key={room.id} href={`/rooms/${room.id}`}>
                  <RoomCard room={room} />
                </Link>
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

  const tSeo = await getTranslations({ locale, namespace: "seo.breadcrumbs" });
  const tEnums = await getTranslations({ locale, namespace: "enums" });
  const loginUrl = getLoginUrl();
  const cityName = tEnums(`city.${room.city}` as any);
  const coverPhoto = room.photos[0];

  // Safe: JSON-LD from i18n translations and DB, sanitized in seo.ts (per Next.js docs recommendation)
  const roomBreadcrumbs = breadcrumbJsonLd(locale, [
    { name: tSeo("home"), path: "" },
    { name: tSeo("rooms"), path: "/rooms" },
    { name: cityName, path: `/rooms/${room.city}` },
    { name: room.title, path: `/rooms/${roomId}` },
  ]);

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
    ...(coverPhoto && { image: getStoragePublicUrl(coverPhoto.url, "room-photos") }),
    offers: {
      "@type": "Offer",
      price: room.totalCost,
      priceCurrency: "EUR",
      availability: "https://schema.org/InStock",
    },
  });

  return (
    <section className="py-12">
      {/* Safe: JSON-LD from i18n translations and DB — no user-supplied HTML */}
      import {routing} from "@/i18n/routing";
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: roomBreadcrumbs }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdScript }} />
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <RoomDetailContent
          room={publicRoomToDetail(room)}
          context={{
            isAuthenticated: false,
            isOwner: false,
            isInvitee: false,
            existingApplication: null,
            loginUrl,
          }}
        />
      </div>
    </section>
  );
}
