import type { StorageBucket } from '@openhospi/shared/constants';

import { SUPABASE_URL } from './constants';

export function getStoragePublicUrl(pathOrUrl: string, bucket: StorageBucket): string {
  if (pathOrUrl.includes('://')) return pathOrUrl;
  return `${SUPABASE_URL}/storage/v1/object/public/${bucket}/${pathOrUrl}`;
}
