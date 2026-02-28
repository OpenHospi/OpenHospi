import {withRLS} from "@openhospi/database";
import {applications, profiles, roomPhotos, rooms} from "@openhospi/database/schema";
import {RoomStatus} from "@openhospi/shared/enums";
import type {ApplicationStatus} from "@openhospi/shared/enums";
import {and, desc, eq, isNull, or} from "drizzle-orm";

import {notBlockedBy} from "@/lib/block-filter";

export type UserApplication = {
    id: string;
    roomId: string;
    roomTitle: string;
    roomCity: string;
    roomRentPrice: number;
    roomCoverPhotoUrl: string | null;
    personalMessage: string | null;
    status: ApplicationStatus;
    appliedAt: Date;
    updatedAt: Date;
};

export type ApplicationDetail = UserApplication & {
    roomDescription: string | null;
    roomHouseType: string | null;
    roomFurnishing: string | null;
    roomSizeM2: number | null;
    roomTotalHousemates: number | null;
    roomAvailableFrom: string | null;
    roomFeatures: string[];
    roomLocationTags: string[];
};

export type RoomDetailForApply = {
    id: string;
    title: string;
    description: string | null;
    city: string;
    neighborhood: string | null;
    address: string | null;
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
    roomVereniging: string | null;
    preferredGender: string | null;
    preferredAgeMin: number | null;
    preferredAgeMax: number | null;
    preferredLifestyleTags: string[];
    ownerId: string;
    createdAt: Date;
    photos: { id: string; slot: number; url: string; caption: string | null }[];
};

export async function getUserApplications(userId: string): Promise<UserApplication[]> {
    const rows = await withRLS(userId, (tx) =>
        tx
            .select({
                id: applications.id,
                roomId: applications.roomId,
                personalMessage: applications.personalMessage,
                status: applications.status,
                appliedAt: applications.appliedAt,
                updatedAt: applications.updatedAt,
                roomTitle: rooms.title,
                roomCity: rooms.city,
                roomRentPrice: rooms.rentPrice,
                roomCoverPhotoUrl: roomPhotos.url,
            })
            .from(applications)
            .innerJoin(rooms, eq(rooms.id, applications.roomId))
            .leftJoin(roomPhotos, and(eq(roomPhotos.roomId, rooms.id), eq(roomPhotos.slot, 1)))
            .where(and(eq(applications.userId, userId), notBlockedBy(rooms.ownerId, userId)))
            .orderBy(desc(applications.appliedAt)),
    );

    return rows.map((r) => ({
        ...r,
        roomRentPrice: Number(r.roomRentPrice),
    }));
}

export async function getApplicationDetail(
    applicationId: string,
    userId: string,
): Promise<ApplicationDetail | null> {
    return withRLS(userId, async (tx) => {
        const [row] = await tx
            .select({
                id: applications.id,
                roomId: applications.roomId,
                personalMessage: applications.personalMessage,
                status: applications.status,
                appliedAt: applications.appliedAt,
                updatedAt: applications.updatedAt,
                roomTitle: rooms.title,
                roomCity: rooms.city,
                roomRentPrice: rooms.rentPrice,
                roomDescription: rooms.description,
                roomHouseType: rooms.houseType,
                roomFurnishing: rooms.furnishing,
                roomSizeM2: rooms.roomSizeM2,
                roomTotalHousemates: rooms.totalHousemates,
                roomAvailableFrom: rooms.availableFrom,
                roomFeatures: rooms.features,
                roomLocationTags: rooms.locationTags,
                roomCoverPhotoUrl: roomPhotos.url,
            })
            .from(applications)
            .innerJoin(rooms, eq(rooms.id, applications.roomId))
            .leftJoin(roomPhotos, and(eq(roomPhotos.roomId, rooms.id), eq(roomPhotos.slot, 1)))
            .where(and(eq(applications.id, applicationId), eq(applications.userId, userId)));

        if (!row) return null;

        return {
            ...row,
            roomRentPrice: Number(row.roomRentPrice),
            roomFeatures: row.roomFeatures ?? [],
            roomLocationTags: row.roomLocationTags ?? [],
        };
    });
}

export async function getApplicationForRoom(
    roomId: string,
    userId: string,
): Promise<{ id: string; status: ApplicationStatus } | null> {
    return withRLS(userId, async (tx) => {
        const [row] = await tx
            .select({id: applications.id, status: applications.status})
            .from(applications)
            .where(and(eq(applications.roomId, roomId), eq(applications.userId, userId)));
        return row ?? null;
    });
}

export async function getRoomDetailForApply(
    roomId: string,
    userId: string,
): Promise<RoomDetailForApply | null> {
    return withRLS(userId, async (tx) => {
        const [userProfile] = await tx
            .select({vereniging: profiles.vereniging})
            .from(profiles)
            .where(eq(profiles.id, userId));

        const verenigingCondition = userProfile?.vereniging
            ? or(isNull(rooms.roomVereniging), eq(rooms.roomVereniging, userProfile.vereniging))!
            : isNull(rooms.roomVereniging);

        const [room] = await tx
            .select({
                id: rooms.id,
                title: rooms.title,
                description: rooms.description,
                city: rooms.city,
                neighborhood: rooms.neighborhood,
                address: rooms.address,
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
                roomVereniging: rooms.roomVereniging,
                preferredGender: rooms.preferredGender,
                preferredAgeMin: rooms.preferredAgeMin,
                preferredAgeMax: rooms.preferredAgeMax,
                preferredLifestyleTags: rooms.preferredLifestyleTags,
                ownerId: rooms.ownerId,
                createdAt: rooms.createdAt,
            })
            .from(rooms)
            .where(and(eq(rooms.id, roomId), eq(rooms.status, RoomStatus.active), verenigingCondition));

        if (!room) return null;

        const photos = await tx
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
    });
}
