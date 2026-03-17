import { api } from '@/lib/api-client';

type BackupData = {
  encryptedPrivateKey: string;
  backupIv: string;
  salt: string;
};

type BackupResponse = BackupData & { createdAt: string };

export async function uploadSignedPreKeyApi(
  deviceUuid: string,
  data: {
    keyId: number;
    publicKey: string;
    signature: string;
  }
): Promise<void> {
  await api.post('/api/mobile/keys/signed-prekey', { deviceId: deviceUuid, ...data });
}

export async function uploadOneTimePreKeysApi(
  deviceUuid: string,
  keys: { keyId: number; publicKey: string }[]
): Promise<void> {
  await api.post('/api/mobile/keys/one-time-prekeys', { deviceId: deviceUuid, keys });
}

export async function getPreKeyCountApi(deviceUuid: string): Promise<number> {
  const result = await api.get<{ count: number }>(
    `/api/mobile/keys/one-time-prekeys?deviceId=${deviceUuid}`
  );
  return result.count;
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
