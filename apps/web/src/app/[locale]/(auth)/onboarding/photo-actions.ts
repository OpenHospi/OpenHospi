"use server";

import {db} from "@openhospi/database";
import {profilePhotos} from "@openhospi/database/schema";
import type {ProfilePhoto} from "@openhospi/database/types";
import {and, eq} from "drizzle-orm";

import {requireSession} from "@/lib/auth-server";
import {deletePhotoFromStorage, uploadPhotoToStorage} from "@/lib/photos";

export async function savePhoto(
    formData: FormData,
): Promise<{ error?: string; photo?: ProfilePhoto }> {
    const session = await requireSession();

    const file = formData.get("file") as File | null;
    const slot = Number(formData.get("slot"));

    if (!file) return {error: "Missing file"};
    if (slot < 1 || slot > 5) return {error: "Invalid slot"};

    try {
        const ext = file.name.split(".").pop() || "jpg";
        const path = `${session.user.id}/slot-${slot}.${ext}`;
        const url = await uploadPhotoToStorage(file, "profile-photos", path);

        const [photo] = await db
            .insert(profilePhotos)
            .values({userId: session.user.id, slot, url})
            .onConflictDoUpdate({
                target: [profilePhotos.userId, profilePhotos.slot],
                set: {url, uploadedAt: new Date()},
            })
            .returning();

        return {photo};
    } catch (e) {
        const message = e instanceof Error ? e.message : "Save failed";
        return {error: message};
    }
}

export async function deletePhoto(slot: number): Promise<{ error?: string }> {
    const session = await requireSession();

    if (slot < 1 || slot > 5) return {error: "Invalid slot"};

    try {
        const [photo] = await db
            .select({url: profilePhotos.url})
            .from(profilePhotos)
            .where(and(eq(profilePhotos.userId, session.user.id), eq(profilePhotos.slot, slot)));

        if (!photo) return {error: "Photo not found"};

        await deletePhotoFromStorage(photo.url);

        await db
            .delete(profilePhotos)
            .where(and(eq(profilePhotos.userId, session.user.id), eq(profilePhotos.slot, slot)));

        return {};
    } catch (e) {
        const message = e instanceof Error ? e.message : "Delete failed";
        return {error: message};
    }
}
