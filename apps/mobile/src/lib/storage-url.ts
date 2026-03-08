import { SUPABASE_URL } from './constants';

type StorageBucket = 'profile-photos' | 'room-photos';

export function getStoragePublicUrl(pathOrUrl: string, bucket: StorageBucket): string {
  if (pathOrUrl.includes('://')) return pathOrUrl;
  return `${SUPABASE_URL}/storage/v1/object/public/${bucket}/${pathOrUrl}`;
}
