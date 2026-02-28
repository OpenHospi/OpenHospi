import {ALLOWED_IMAGE_TYPES, MAX_AVATAR_SIZE, MAX_ROOM_PHOTO_SIZE} from "@openhospi/shared/constants";
import type {AllowedImageType} from "@openhospi/shared/constants";

import {supabaseAdmin} from "@/lib/supabase-server";

const HEIC_TYPES = new Set<string>(["image/heic", "image/heif"]);

async function convertHeicToJpeg(buffer: Buffer): Promise<Buffer> {
    const decode = (await import("heic-decode")).default;
    const sharp = (await import("sharp")).default;

    const {width, height, data} = await decode({
        buffer: new Uint8Array(buffer),
    });

    return sharp(Buffer.from(data.buffer), {
        raw: {width, height, channels: 4},
    })
        .jpeg({quality: 85})
        .toBuffer();
}

export async function uploadPhotoToStorage(
    file: File,
    bucket: string,
    path: string,
): Promise<string> {
    const maxSize = bucket === "room-photos" ? MAX_ROOM_PHOTO_SIZE : MAX_AVATAR_SIZE;

    if (file.size > maxSize) {
        throw new Error("File too large");
    }

    if (!ALLOWED_IMAGE_TYPES.includes(file.type as AllowedImageType)) {
        throw new Error("Invalid file type");
    }

    let buffer: Buffer<ArrayBufferLike> = Buffer.from(await file.arrayBuffer());
    let contentType = file.type;
    let finalPath = path;

    if (HEIC_TYPES.has(file.type)) {
        buffer = await convertHeicToJpeg(buffer);
        contentType = "image/jpeg";
        finalPath = path.replace(/\.[^.]+$/, ".jpg");
    }

    const {error} = await supabaseAdmin.storage
        .from(bucket)
        .upload(finalPath, buffer, {contentType, upsert: true});

    if (error) throw new Error(error.message);

    const {data} = supabaseAdmin.storage.from(bucket).getPublicUrl(finalPath);
    return data.publicUrl;
}

export function extractStoragePath(url: string, bucket: string): string | null {
    // Handles both remote and local URLs:
    // https://<ref>.supabase.co/storage/v1/object/public/<bucket>/<path>
    // http://127.0.0.1:54321/storage/v1/object/public/<bucket>/<path>
    const marker = `/storage/v1/object/public/${bucket}/`;
    const idx = url.indexOf(marker);
    if (idx === -1) return null;
    return decodeURIComponent(url.slice(idx + marker.length));
}

export async function deletePhotoFromStorage(url: string): Promise<void> {
    // Try both buckets
    for (const bucket of ["profile-photos", "room-photos"] as const) {
        const path = extractStoragePath(url, bucket);
        if (path) {
            await supabaseAdmin.storage.from(bucket).remove([path]);
            return;
        }
    }
}
