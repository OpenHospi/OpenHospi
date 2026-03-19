import type { StorageBucket } from "@openhospi/shared/constants";

export function getStoragePublicUrl(pathOrUrl: string, bucket: StorageBucket): string {
  if (pathOrUrl.includes("://")) {
    return pathOrUrl;
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "http://127.0.0.1:54321";
  return `${supabaseUrl}/storage/v1/object/public/${bucket}/${pathOrUrl}`;
}
