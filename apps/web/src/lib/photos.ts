import { ALLOWED_IMAGE_TYPES, MAX_AVATAR_SIZE } from "@openhospi/shared/constants";
import { createSupabaseAdmin } from "@openhospi/supabase";

export async function uploadPhotoToStorage(
  bucket: string,
  path: string,
  file: File,
): Promise<string> {
  if (!ALLOWED_IMAGE_TYPES.includes(file.type as (typeof ALLOWED_IMAGE_TYPES)[number])) {
    throw new Error("Invalid file type");
  }
  if (file.size > MAX_AVATAR_SIZE) {
    throw new Error("File too large");
  }

  const supabase = createSupabaseAdmin();
  const { error } = await supabase.storage.from(bucket).upload(path, file, {
    upsert: true,
    contentType: file.type,
  });

  if (error) throw new Error(`Upload failed: ${error.message}`);

  return getPublicPhotoUrl(bucket, path);
}

export async function deletePhotoFromStorage(bucket: string, path: string): Promise<void> {
  const supabase = createSupabaseAdmin();
  const { error } = await supabase.storage.from(bucket).remove([path]);
  if (error) throw new Error(`Delete failed: ${error.message}`);
}

export function getPublicPhotoUrl(bucket: string, path: string): string {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  return `${supabaseUrl}/storage/v1/object/public/${bucket}/${path}`;
}
