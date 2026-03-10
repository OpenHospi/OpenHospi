import { api } from '@/lib/api-client';

type BackupData = {
  encryptedPrivateKey: string;
  backupIv: string;
  salt: string;
};

type BackupResponse = BackupData & { createdAt: string };

export async function uploadIdentityKeyApi(
  identityPublicKey: string,
  signingPublicKey: string
): Promise<void> {
  await api.post('/api/mobile/keys/identity', { identityPublicKey, signingPublicKey });
}

export async function uploadSignedPreKeyApi(data: {
  keyId: number;
  publicKey: string;
  signature: string;
}): Promise<void> {
  await api.post('/api/mobile/keys/signed-prekey', data);
}

export async function uploadOneTimePreKeysApi(
  keys: { keyId: number; publicKey: string }[]
): Promise<void> {
  await api.post('/api/mobile/keys/one-time-prekeys', { keys });
}

export async function getPreKeyCountApi(): Promise<number> {
  const result = await api.get<{ count: number }>('/api/mobile/keys/one-time-prekeys');
  return result.count;
}

export async function fetchPreKeyBundleApi(userId: string) {
  return api.get<{
    identityPublicKey: string;
    signingPublicKey: string;
    signedPreKeyId: number;
    signedPreKeyPublic: string;
    signedPreKeySignature: string;
    oneTimePreKeyId?: number;
    oneTimePreKeyPublic?: string;
  } | null>(`/api/mobile/keys/bundle/${userId}`);
}

export async function uploadBackupApi(data: BackupData): Promise<void> {
  await api.post('/api/mobile/keys/backup', data);
}

export async function fetchBackupApi(): Promise<BackupResponse | null> {
  return api.get<BackupResponse | null>('/api/mobile/keys/backup');
}

export async function deleteBackupApi(): Promise<void> {
  await api.delete('/api/mobile/keys/backup');
}
