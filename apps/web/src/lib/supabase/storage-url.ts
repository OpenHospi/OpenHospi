/**
 * Client-safe utility for converting storage paths to public URLs.
 * This file has no server-only dependencies and can be used in client components.
 */

/**
 * Converts a storage path to a public URL.
 * Works in both client and server components.
 *
 * @param pathOrUrl - Storage path or full URL
 * @param bucket - The storage bucket name
 * @returns Full public URL
 */
export function getStoragePublicUrl(
  pathOrUrl: string,
  bucket: "profile-photos" | "room-photos",
): string {
  // If it's already a URL, return as is
  if (pathOrUrl.includes("://")) {
    return pathOrUrl;
  }

  // Construct the public URL
  // Get the Supabase URL from environment or use localhost for development
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "http://127.0.0.1:54321";
  return `${supabaseUrl}/storage/v1/object/public/${bucket}/${pathOrUrl}`;
}
