import { DiscoverSort } from "@openhospi/shared/enums";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { RoomCard } from "@/components/app/room-card";
import { Link } from "@/i18n/navigation-app";
import { requireSession } from "@/lib/auth-server";
import type { DiscoverCursor, DiscoverFilters } from "@/lib/discover";
import { getDiscoverRooms } from "@/lib/discover";
import { getProfile } from "@/lib/profile";

import { DiscoverFiltersPanel } from "./discover-filters";
import { DiscoverLoadMore } from "./discover-load-more";

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
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function parseSearchParams(sp: Record<string, string | string[] | undefined>): {
  filters: DiscoverFilters;
  sort: DiscoverSort;
  cursor: DiscoverCursor | undefined;
} {
  const first = (key: string) => {
    const v = sp[key];
    return typeof v === "string" ? v : undefined;
  };

  const rawSort = first("sort");
  const sort: DiscoverSort = (DiscoverSort.values as readonly string[]).includes(rawSort ?? "")
    ? (rawSort as DiscoverSort)
    : DiscoverSort.newest;

  const minPriceStr = first("minPrice");
  const maxPriceStr = first("maxPrice");
  const featuresStr = first("features");
  const locationTagsStr = first("locationTags");

  const cursorCreatedAt = first("cursorCreatedAt");
  const cursorId = first("cursorId");
  const cursor =
    cursorCreatedAt && cursorId ? { createdAt: cursorCreatedAt, id: cursorId } : undefined;

  return {
    filters: {
      city: first("city"),
      minPrice: minPriceStr ? Number(minPriceStr) : undefined,
      maxPrice: maxPriceStr ? Number(maxPriceStr) : undefined,
      houseType: first("houseType"),
      furnishing: first("furnishing"),
      availableFrom: first("availableFrom"),
      features: featuresStr ? featuresStr.split(",") : undefined,
      locationTags: locationTagsStr ? locationTagsStr.split(",") : undefined,
    },
    sort,
    cursor,
  };
}

export default async function DiscoverPage({ params, searchParams }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const { user } = await requireSession();
  const sp = await searchParams;

  const hasSearchParams = Object.keys(sp).length > 0;
  const parsed = parseSearchParams(sp);
  const { sort, cursor } = parsed;
  let { filters } = parsed;

  // Pre-fill from profile when no search params
  if (!hasSearchParams) {
    const profile = await getProfile(user.id);
    if (profile) {
      if (profile.preferredCity) filters = { ...filters, city: profile.preferredCity };
      if (profile.maxRent) filters = { ...filters, maxPrice: Number(profile.maxRent) };
    }
  }

  const { rooms, nextCursor } = await getDiscoverRooms(user.id, filters, sort, cursor);
  const t = await getTranslations({ locale, namespace: "app.discover" });

  // Build plain searchParams record for load more
  const plainParams: Record<string, string> = {};
  for (const [key, val] of Object.entries(sp)) {
    if (typeof val === "string" && key !== "cursorCreatedAt" && key !== "cursorId")
      plainParams[key] = val;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h1 className="text-2xl font-bold tracking-tight">{t("title")}</h1>
      </div>

      <DiscoverFiltersPanel filters={filters} sort={sort} />

      {rooms.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center">
          <p className="text-muted-foreground">{t("empty")}</p>
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {rooms.map((room) => (
              <Link key={room.id} href={`/discover/${room.id}`}>
                <RoomCard room={room} />
              </Link>
            ))}
          </div>
          {nextCursor && <DiscoverLoadMore nextCursor={nextCursor} searchParams={plainParams} />}
        </>
      )}
    </div>
  );
}
