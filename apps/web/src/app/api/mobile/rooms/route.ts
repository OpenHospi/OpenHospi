import type { DiscoverSort } from "@openhospi/shared/enums";
import { NextResponse } from "next/server";

import { requireApiSession } from "@/app/api/mobile/_lib/auth";
import type { DiscoverCursor, DiscoverFilters } from "@/lib/queries/discover";
import { getDiscoverRooms } from "@/lib/queries/discover";

export async function GET(request: Request) {
  try {
    const session = await requireApiSession(request);
    const url = new URL(request.url);

    const filters: DiscoverFilters = {};
    if (url.searchParams.get("city"))
      filters.city = url.searchParams.get("city") as DiscoverFilters["city"];
    if (url.searchParams.get("minPrice"))
      filters.minPrice = Number(url.searchParams.get("minPrice"));
    if (url.searchParams.get("maxPrice"))
      filters.maxPrice = Number(url.searchParams.get("maxPrice"));
    if (url.searchParams.get("houseType"))
      filters.houseType = url.searchParams.get("houseType") as DiscoverFilters["houseType"];
    if (url.searchParams.get("furnishing"))
      filters.furnishing = url.searchParams.get("furnishing") as DiscoverFilters["furnishing"];
    if (url.searchParams.get("availableFrom"))
      filters.availableFrom = url.searchParams.get("availableFrom")!;
    if (url.searchParams.get("features"))
      filters.features = url.searchParams
        .get("features")!
        .split(",") as DiscoverFilters["features"];
    if (url.searchParams.get("locationTags"))
      filters.locationTags = url.searchParams
        .get("locationTags")!
        .split(",") as DiscoverFilters["locationTags"];

    const sort = (url.searchParams.get("sort") ?? "newest") as DiscoverSort;

    let cursor: DiscoverCursor | undefined;
    const cursorCreatedAt = url.searchParams.get("cursorCreatedAt");
    const cursorId = url.searchParams.get("cursorId");
    if (cursorCreatedAt && cursorId) {
      cursor = { createdAt: cursorCreatedAt, id: cursorId };
    }

    const result = await getDiscoverRooms(session.user.id, filters, sort, cursor);
    return NextResponse.json(result);
  } catch (e) {
    if (e instanceof NextResponse) return e;
    throw e;
  }
}
