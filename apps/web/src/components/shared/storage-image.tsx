import Image from "next/image";
import type { ImageProps } from "next/image";

import { getStoragePublicUrl } from "@/lib/supabase/storage-url";

type StorageImageProps = Omit<ImageProps, "src"> & {
  src: string;
  bucket?: "profile-photos" | "room-photos";
};

/**
 * A wrapper around Next.js Image that handles Supabase storage.
 * Automatically converts storage paths to public URLs.
 *
 * @param src - Storage path or full URL
 * @param bucket - The Supabase storage bucket name
 * @param props - All other Next.js Image props (including required alt)
 */
export function StorageImage({ src, bucket = "profile-photos", ...props }: StorageImageProps) {
  const imageSrc = getStoragePublicUrl(src, bucket);

  // eslint-disable-next-line jsx-a11y/alt-text -- alt is passed via props
  return <Image src={imageSrc} {...props} />;
}
