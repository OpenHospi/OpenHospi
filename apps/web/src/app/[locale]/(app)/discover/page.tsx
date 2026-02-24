import { ROOMS_PER_PAGE } from "@openhospi/shared/constants";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { requireSession } from "@/lib/auth-server";
import type { DiscoverFilters, DiscoverSort } from "@/lib/discover";
import { getDiscoverRooms } from "@/lib/discover";
import { getProfile } from "@/lib/profile";

import { DiscoverFiltersPanel } from "./discover-filters";
import { DiscoverPagination } from "./discover-pagination";
import { DiscoverRoomCard } from "./discover-room-card";

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
  page: number;
} {
  const first = (key: string) => {
    const v = sp[key];
    return typeof v === "string" ? v : undefined;
  };

  const validSorts = ["newest", "cheapest", "most_expensive"] as const;
  const rawSort = first("sort");
  const sort: DiscoverSort = validSorts.includes(rawSort as DiscoverSort)
    ? (rawSort as DiscoverSort)
    : "newest";

  const page = Math.max(1, Number.parseInt(first("page") ?? "1", 10) || 1);

  const minPriceStr = first("minPrice");
  const maxPriceStr = first("maxPrice");
  const featuresStr = first("features");
  const locationTagsStr = first("locationTags");

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
    page,
  };
}

export default async function DiscoverPage({ params, searchParams }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const { user } = await requireSession(locale);
  const sp = await searchParams;

  const hasSearchParams = Object.keys(sp).length > 0;
  const parsed = parseSearchParams(sp);
  const { sort, page } = parsed;
  let { filters } = parsed;

  // Pre-fill from profile when no search params
  if (!hasSearchParams) {
    const profile = await getProfile(user.id);
    if (profile) {
      if (profile.preferred_city) filters = { ...filters, city: profile.preferred_city };
      if (profile.max_rent) filters = { ...filters, maxPrice: profile.max_rent };
    }
  }

  const { rooms, total } = await getDiscoverRooms(user.id, filters, page, sort);
  const totalPages = Math.ceil(total / ROOMS_PER_PAGE);
  const t = await getTranslations({ locale, namespace: "app.discover" });

  // Build plain searchParams record for pagination
  const plainParams: Record<string, string> = {};
  for (const [key, val] of Object.entries(sp)) {
    if (typeof val === "string") plainParams[key] = val;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h1 className="text-2xl font-bold tracking-tight">{t("title")}</h1>
        {total > 0 && (
          <p className="text-sm text-muted-foreground">
            {t("roomCount", {
              showing: rooms.length,
              total,
            })}
          </p>
        )}
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
              <DiscoverRoomCard key={room.id} room={room} />
            ))}
          </div>
          <DiscoverPagination
            currentPage={page}
            totalPages={totalPages}
            searchParams={plainParams}
          />
        </>
      )}
    </div>
  );
}
