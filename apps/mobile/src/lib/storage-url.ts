import type { StorageBucket } from '@openhospi/shared/constants';

import { EXPO_PUBLIC_SUPABASE_URL } from '@/lib/constants';

export function getStoragePublicUrl(pathOrUrl: string, bucket: StorageBucket): string {
  if (pathOrUrl.includes('://')) return pathOrUrl;
  return `${EXPO_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${bucket}/${pathOrUrl}`;
}
