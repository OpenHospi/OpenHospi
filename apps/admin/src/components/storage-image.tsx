import { STORAGE_BUCKET_PROFILE_PHOTOS } from "@openhospi/shared/constants";
import type { StorageBucket } from "@openhospi/shared/constants";
import Image from "next/image";
import type { ImageProps } from "next/image";

import { getStoragePublicUrl } from "@/lib/supabase/storage-url";

type StorageImageProps = Omit<ImageProps, "src"> & {
  src: string;
  bucket?: StorageBucket;
};

export function StorageImage({
  src,
  bucket = STORAGE_BUCKET_PROFILE_PHOTOS,
  ...props
}: StorageImageProps) {
  const imageSrc = getStoragePublicUrl(src, bucket);

  // eslint-disable-next-line jsx-a11y/alt-text -- alt is passed via props
  return <Image src={imageSrc} {...props} />;
}
