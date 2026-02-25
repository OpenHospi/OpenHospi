import { upload } from "@vercel/blob/client";

export async function uploadPhotoToBlob(
  file: File,
  bucket: string,
  slot: number,
  type: "profile" | "room",
  roomId?: string,
): Promise<string> {
  const ext = file.name.split(".").pop() || "jpg";

  const blob = await upload(`${bucket}/slot-${slot}.${ext}`, file, {
    access: "public",
    handleUploadUrl: "/api/photos/upload",
    clientPayload: JSON.stringify({ type, slot, roomId }),
  });

  return blob.url;
}
