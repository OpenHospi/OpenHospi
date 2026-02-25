import { db, withRLS } from "@openhospi/database";
import { roomPhotos, rooms } from "@openhospi/database/schema";
import type { RoomPhoto } from "@openhospi/database/types";
import { ROOMS_PER_PAGE } from "@openhospi/shared/constants";
import { and, asc, desc, eq, gte, isNull, lte, sql } from "drizzle-orm";

export type DiscoverRoom = {
  id: string;
  title: string;
  city: string;
  rentPrice: number;
  houseType: string | null;
  furnishing: string | null;
  roomSizeM2: number | null;
  availableFrom: string | null;
  totalHousemates: number | null;
  features: string[];
  locationTags: string[];
  coverPhotoUrl: string | null;
  createdAt: Date;
};

export type DiscoverFilters = {
  city?: string;
  minPrice?: number;
  maxPrice?: number;
  houseType?: string;
  furnishing?: string;
  availableFrom?: string;
  features?: string[];
  locationTags?: string[];
};

export type DiscoverSort = "newest" | "cheapest" | "most_expensive";

export type DiscoverCursor = {
  createdAt: string;
  id: string;
};

export type DiscoverResult = {
  rooms: DiscoverRoom[];
  nextCursor: DiscoverCursor | null;
};

export type PublicRoom = {
  id: string;
  title: string;
  description: string | null;
  city: string;
  neighborhood: string | null;
  rentPrice: number;
  deposit: number | null;
  utilitiesIncluded: boolean | null;
  roomSizeM2: number | null;
  availableFrom: string | null;
  availableUntil: string | null;
  rentalType: string | null;
  houseType: string | null;
  furnishing: string | null;
  totalHousemates: number | null;
  features: string[];
  locationTags: string[];
  preferredGender: string | null;
  preferredAgeMin: number | null;
  preferredAgeMax: number | null;
  preferredLifestyleTags: string[];
  createdAt: Date;
  photos: Pick<RoomPhoto, "id" | "slot" | "url" | "caption">[];
};

export type CityWithCount = {
  city: string;
  count: number;
};

/* eslint-disable @typescript-eslint/no-explicit-any -- Dynamic filter values from URL params can't be statically typed as Drizzle enum values */
function buildDiscoverConditions(
  userId: string,
  filters: DiscoverFilters,
  sort: DiscoverSort,
  cursor?: DiscoverCursor,
): ReturnType<typeof eq>[] {
  const conditions: ReturnType<typeof eq>[] = [eq(rooms.status, "active")];

  // Vereiniging visibility: show non-vereniging rooms + rooms matching user's vereniging
  conditions.push(
    sql`(${rooms.roomVereniging} IS NULL OR ${rooms.roomVereniging} = (SELECT vereniging FROM profiles WHERE id = ${userId}))` as any,
  );

  // Gender matching: rooms with a preference only shown to matching profiles
  conditions.push(
    sql`(${rooms.preferredGender} = 'geen_voorkeur' OR ${rooms.preferredGender}::text = (SELECT gender FROM profiles WHERE id = ${userId}))` as any,
  );

  if (filters.city) conditions.push(eq(rooms.city, filters.city as any));
  if (filters.minPrice != null) conditions.push(gte(rooms.rentPrice, String(filters.minPrice)));
  if (filters.maxPrice != null) conditions.push(lte(rooms.rentPrice, String(filters.maxPrice)));
  if (filters.houseType) conditions.push(eq(rooms.houseType, filters.houseType as any));
  if (filters.furnishing) conditions.push(eq(rooms.furnishing, filters.furnishing as any));
  if (filters.availableFrom) conditions.push(lte(rooms.availableFrom, filters.availableFrom));
  if (filters.features?.length) conditions.push(sql`${rooms.features} @> ${filters.features}` as any);
  if (filters.locationTags?.length) conditions.push(sql`${rooms.locationTags} @> ${filters.locationTags}` as any);

  if (cursor) {
    if (sort === "cheapest") {
      conditions.push(sql`(${rooms.rentPrice}, ${rooms.id}) > (${cursor.createdAt}, ${cursor.id})` as any);
    } else if (sort === "most_expensive") {
      conditions.push(sql`(${rooms.rentPrice}, ${rooms.id}) < (${cursor.createdAt}, ${cursor.id})` as any);
    } else {
      conditions.push(sql`(${rooms.createdAt}, ${rooms.id}) < (${cursor.createdAt}, ${cursor.id})` as any);
    }
  }

  return conditions;
}
/* eslint-enable @typescript-eslint/no-explicit-any */

export async function getDiscoverRooms(
  userId: string,
  filters: DiscoverFilters,
  sort: DiscoverSort,
  cursor?: DiscoverCursor,
): Promise<DiscoverResult> {
  return withRLS(userId, async (tx) => {
    const conditions = buildDiscoverConditions(userId, filters, sort, cursor);
    const where = and(...conditions);

    let orderBy;
    if (sort === "cheapest") {
      orderBy = [asc(rooms.rentPrice), asc(rooms.id)];
    } else if (sort === "most_expensive") {
      orderBy = [desc(rooms.rentPrice), desc(rooms.id)];
    } else {
      orderBy = [desc(rooms.createdAt), desc(rooms.id)];
    }

    const dataResult = await tx
      .select({
        id: rooms.id,
        title: rooms.title,
        city: rooms.city,
        rentPrice: rooms.rentPrice,
        houseType: rooms.houseType,
        furnishing: rooms.furnishing,
        roomSizeM2: rooms.roomSizeM2,
        availableFrom: rooms.availableFrom,
        totalHousemates: rooms.totalHousemates,
        features: rooms.features,
        locationTags: rooms.locationTags,
        createdAt: rooms.createdAt,
        coverPhotoUrl: sql<string | null>`(SELECT url FROM room_photos WHERE room_id = ${rooms.id} AND slot = 1 LIMIT 1)`,
      })
      .from(rooms)
      .where(where)
      .orderBy(...orderBy)
      .limit(ROOMS_PER_PAGE + 1);

    const hasMore = dataResult.length > ROOMS_PER_PAGE;
    const resultRows = hasMore ? dataResult.slice(0, ROOMS_PER_PAGE) : dataResult;

    const mappedRooms = resultRows.map((r) => ({
      ...r,
      rentPrice: Number(r.rentPrice),
      features: r.features ?? [],
      locationTags: r.locationTags ?? [],
    }));

    const lastRow = resultRows[resultRows.length - 1];
    const nextCursor: DiscoverCursor | null =
      hasMore && lastRow
        ? {
            createdAt:
              sort === "newest"
                ? lastRow.createdAt.toISOString()
                : String(lastRow.rentPrice),
            id: lastRow.id,
          }
        : null;

    return { rooms: mappedRooms, nextCursor };
  });
}

export async function getPublicRoom(roomId: string): Promise<PublicRoom | null> {
  const [room] = await db
    .select({
      id: rooms.id,
      title: rooms.title,
      description: rooms.description,
      city: rooms.city,
      neighborhood: rooms.neighborhood,
      rentPrice: rooms.rentPrice,
      deposit: rooms.deposit,
      utilitiesIncluded: rooms.utilitiesIncluded,
      roomSizeM2: rooms.roomSizeM2,
      availableFrom: rooms.availableFrom,
      availableUntil: rooms.availableUntil,
      rentalType: rooms.rentalType,
      houseType: rooms.houseType,
      furnishing: rooms.furnishing,
      totalHousemates: rooms.totalHousemates,
      features: rooms.features,
      locationTags: rooms.locationTags,
      preferredGender: rooms.preferredGender,
      preferredAgeMin: rooms.preferredAgeMin,
      preferredAgeMax: rooms.preferredAgeMax,
      preferredLifestyleTags: rooms.preferredLifestyleTags,
      createdAt: rooms.createdAt,
    })
    .from(rooms)
    .where(
      and(eq(rooms.id, roomId), eq(rooms.status, "active"), isNull(rooms.roomVereniging)),
    );

  if (!room) return null;

  const photos = await db
    .select({ id: roomPhotos.id, slot: roomPhotos.slot, url: roomPhotos.url, caption: roomPhotos.caption })
    .from(roomPhotos)
    .where(eq(roomPhotos.roomId, roomId))
    .orderBy(roomPhotos.slot);

  return {
    ...room,
    rentPrice: Number(room.rentPrice),
    deposit: room.deposit ? Number(room.deposit) : null,
    features: room.features ?? [],
    locationTags: room.locationTags ?? [],
    preferredLifestyleTags: room.preferredLifestyleTags ?? [],
    photos,
  };
}

export async function getPublicRoomsByCity(
  city: string,
  limit: number,
): Promise<DiscoverRoom[]> {
  const rows = await db
    .select({
      id: rooms.id,
      title: rooms.title,
      city: rooms.city,
      rentPrice: rooms.rentPrice,
      houseType: rooms.houseType,
      furnishing: rooms.furnishing,
      roomSizeM2: rooms.roomSizeM2,
      availableFrom: rooms.availableFrom,
      totalHousemates: rooms.totalHousemates,
      features: rooms.features,
      locationTags: rooms.locationTags,
      createdAt: rooms.createdAt,
      coverPhotoUrl: sql<string | null>`(SELECT url FROM room_photos WHERE room_id = ${rooms.id} AND slot = 1 LIMIT 1)`,
    })
    .from(rooms)
    .where(
      and(
        eq(rooms.status, "active"),
        isNull(rooms.roomVereniging),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- city comes from URL slug
        eq(rooms.city, city as any),
      ),
    )
    .orderBy(desc(rooms.createdAt))
    .limit(limit);

  return rows.map((r) => ({
    ...r,
    rentPrice: Number(r.rentPrice),
    features: r.features ?? [],
    locationTags: r.locationTags ?? [],
  }));
}

export async function getCitiesWithRoomCount(): Promise<CityWithCount[]> {
  const rows = await db
    .select({
      city: rooms.city,
      count: sql<number>`count(*)::int`,
    })
    .from(rooms)
    .where(and(eq(rooms.status, "active"), isNull(rooms.roomVereniging)))
    .groupBy(rooms.city)
    .orderBy(sql`count(*) DESC, ${rooms.city} ASC`);

  return rows;
}
