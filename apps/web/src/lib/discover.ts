import {db, withRLS} from "@openhospi/database";
import {profiles, roomPhotos, rooms} from "@openhospi/database/schema";
import type {RoomPhoto} from "@openhospi/database/types";
import {ROOMS_PER_PAGE} from "@openhospi/shared/constants";
import {DiscoverSort, GenderPreference, RoomStatus, LocationTag, RoomFeature} from "@openhospi/shared/enums";
import {
    and,
    arrayContains,
    asc,
    count,
    desc,
    eq,
    gt,
    gte,
    isNull,
    lt,
    lte,
    or,
    type SQL,
} from "drizzle-orm";

import {notBlockedBy} from "@/lib/block-filter";

export type DiscoverRoom = {
    id: string;
    title: string;
    city: string;
    rentPrice: number;
    serviceCosts: number | null;
    totalCost: number;
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

export type {DiscoverSort};

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
    serviceCosts: number | null;
    totalCost: number;
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
function buildCursorCondition(sort: DiscoverSort, cursor: DiscoverCursor) {
    if (sort === DiscoverSort.cheapest) {
        return or(
            gt(rooms.totalCost, cursor.createdAt),
            and(eq(rooms.totalCost, cursor.createdAt), gt(rooms.id, cursor.id)),
        );
    }
    if (sort === DiscoverSort.most_expensive) {
        return or(
            lt(rooms.totalCost, cursor.createdAt),
            and(eq(rooms.totalCost, cursor.createdAt), lt(rooms.id, cursor.id)),
        );
    }
    return or(
        lt(rooms.createdAt, new Date(cursor.createdAt)),
        and(eq(rooms.createdAt, new Date(cursor.createdAt)), lt(rooms.id, cursor.id)),
    );
}

function buildDiscoverConditions(
    filters: DiscoverFilters,
    sort: DiscoverSort,
    userVereniging: string | null,
    userGender: string | null,
    userId: string,
    cursor?: DiscoverCursor,
): SQL[] {
    const conditions: SQL[] = [eq(rooms.status, RoomStatus.active)];

    // Exclude rooms from blocked/blocking users
    conditions.push(notBlockedBy(rooms.ownerId, userId));

    // Vereniging visibility: show non-vereniging rooms + rooms matching user's vereniging
    if (userVereniging) {
        conditions.push(
            or(isNull(rooms.roomVereniging), eq(rooms.roomVereniging, userVereniging as any))!,
        );
    } else {
        conditions.push(isNull(rooms.roomVereniging));
    }

    // Gender matching: rooms with a preference only shown to matching profiles
    if (userGender) {
        conditions.push(
            or(
                eq(rooms.preferredGender, GenderPreference.no_preference as any),
                eq(rooms.preferredGender, userGender as any),
            )!,
        );
    } else {
        conditions.push(eq(rooms.preferredGender, GenderPreference.no_preference as any));
    }

    if (filters.city) conditions.push(eq(rooms.city, filters.city as any));
    if (filters.minPrice != null) conditions.push(gte(rooms.totalCost, String(filters.minPrice)));
    if (filters.maxPrice != null) conditions.push(lte(rooms.totalCost, String(filters.maxPrice)));
    if (filters.houseType) conditions.push(eq(rooms.houseType, filters.houseType as any));
    if (filters.furnishing) conditions.push(eq(rooms.furnishing, filters.furnishing as any));
    if (filters.availableFrom) conditions.push(lte(rooms.availableFrom, filters.availableFrom));
    if (filters.features?.length)
        conditions.push(arrayContains(rooms.features, filters.features as RoomFeature[]));
    if (filters.locationTags?.length)
        conditions.push(arrayContains(rooms.locationTags, filters.locationTags as LocationTag[]));

    if (cursor) conditions.push(buildCursorCondition(sort, cursor) as any);

    return conditions;
}


export async function getDiscoverRooms(
    userId: string,
    filters: DiscoverFilters,
    sort: DiscoverSort,
    cursor?: DiscoverCursor,
): Promise<DiscoverResult> {
    return withRLS(userId, async (tx) => {
        const [userProfile] = await tx
            .select({vereniging: profiles.vereniging, gender: profiles.gender})
            .from(profiles)
            .where(eq(profiles.id, userId));

        const conditions = buildDiscoverConditions(
            filters,
            sort,
            userProfile?.vereniging ?? null,
            userProfile?.gender ?? null,
            userId,
            cursor,
        );
        const where = and(...conditions);

        let orderBy;
        if (sort === DiscoverSort.cheapest) {
            orderBy = [asc(rooms.totalCost), asc(rooms.id)];
        } else if (sort === DiscoverSort.most_expensive) {
            orderBy = [desc(rooms.totalCost), desc(rooms.id)];
        } else {
            orderBy = [desc(rooms.createdAt), desc(rooms.id)];
        }

        const dataResult = await tx
            .select({
                id: rooms.id,
                title: rooms.title,
                city: rooms.city,
                rentPrice: rooms.rentPrice,
                serviceCosts: rooms.serviceCosts,
                totalCost: rooms.totalCost,
                houseType: rooms.houseType,
                furnishing: rooms.furnishing,
                roomSizeM2: rooms.roomSizeM2,
                availableFrom: rooms.availableFrom,
                totalHousemates: rooms.totalHousemates,
                features: rooms.features,
                locationTags: rooms.locationTags,
                createdAt: rooms.createdAt,
                coverPhotoUrl: roomPhotos.url,
            })
            .from(rooms)
            .leftJoin(roomPhotos, and(eq(roomPhotos.roomId, rooms.id), eq(roomPhotos.slot, 1)))
            .where(where)
            .orderBy(...orderBy)
            .limit(ROOMS_PER_PAGE + 1);

        const hasMore = dataResult.length > ROOMS_PER_PAGE;
        const resultRows = hasMore ? dataResult.slice(0, ROOMS_PER_PAGE) : dataResult;

        const mappedRooms = resultRows.map((r) => ({
            ...r,
            rentPrice: Number(r.rentPrice),
            serviceCosts: r.serviceCosts ? Number(r.serviceCosts) : null,
            totalCost: Number(r.totalCost),
            features: r.features ?? [],
            locationTags: r.locationTags ?? [],
        }));

        const lastMapped = mappedRooms[mappedRooms.length - 1];
        const nextCursor: DiscoverCursor | null =
            hasMore && lastMapped
                ? {
                    createdAt:
                        sort === DiscoverSort.newest
                            ? lastMapped.createdAt.toISOString()
                            : String(lastMapped.totalCost),
                    id: lastMapped.id,
                }
                : null;

        return {rooms: mappedRooms, nextCursor};
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
            serviceCosts: rooms.serviceCosts,
            totalCost: rooms.totalCost,
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
            and(eq(rooms.id, roomId), eq(rooms.status, RoomStatus.active), isNull(rooms.roomVereniging)),
        );

    if (!room) return null;

    const photos = await db
        .select({
            id: roomPhotos.id,
            slot: roomPhotos.slot,
            url: roomPhotos.url,
            caption: roomPhotos.caption,
        })
        .from(roomPhotos)
        .where(eq(roomPhotos.roomId, roomId))
        .orderBy(roomPhotos.slot);

    return {
        ...room,
        rentPrice: Number(room.rentPrice),
        deposit: room.deposit ? Number(room.deposit) : null,
        serviceCosts: room.serviceCosts ? Number(room.serviceCosts) : null,
        totalCost: Number(room.totalCost),
        features: room.features ?? [],
        locationTags: room.locationTags ?? [],
        preferredLifestyleTags: room.preferredLifestyleTags ?? [],
        photos,
    };
}

export async function getPublicRoomsByCity(city: string, limit: number): Promise<DiscoverRoom[]> {
    const rows = await db
        .select({
            id: rooms.id,
            title: rooms.title,
            city: rooms.city,
            rentPrice: rooms.rentPrice,
            serviceCosts: rooms.serviceCosts,
            totalCost: rooms.totalCost,
            houseType: rooms.houseType,
            furnishing: rooms.furnishing,
            roomSizeM2: rooms.roomSizeM2,
            availableFrom: rooms.availableFrom,
            totalHousemates: rooms.totalHousemates,
            features: rooms.features,
            locationTags: rooms.locationTags,
            createdAt: rooms.createdAt,
            coverPhotoUrl: roomPhotos.url,
        })
        .from(rooms)
        .leftJoin(roomPhotos, and(eq(roomPhotos.roomId, rooms.id), eq(roomPhotos.slot, 1)))
        .where(
            and(
                eq(rooms.status, RoomStatus.active),
                isNull(rooms.roomVereniging),
                eq(rooms.city, city as any),
            ),
        )
        .orderBy(desc(rooms.createdAt))
        .limit(limit);

    return rows.map((r) => ({
        ...r,
        rentPrice: Number(r.rentPrice),
        serviceCosts: r.serviceCosts ? Number(r.serviceCosts) : null,
        totalCost: Number(r.totalCost),
        features: r.features ?? [],
        locationTags: r.locationTags ?? [],
    }));
}

export async function getCitiesWithRoomCount(): Promise<CityWithCount[]> {
    const rows = await db
        .select({
            city: rooms.city,
            count: count(),
        })
        .from(rooms)
        .where(and(eq(rooms.status, RoomStatus.active), isNull(rooms.roomVereniging)))
        .groupBy(rooms.city)
        .orderBy(desc(count()), asc(rooms.city));

    return rows;
}
