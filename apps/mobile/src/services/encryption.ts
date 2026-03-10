import { api } from '@/lib/api-client';

type BackupData = {
  encryptedPrivateKey: string;
  backupIv: string;
  salt: string;
};

type BackupResponse = BackupData & { createdAt: string };

export async function uploadPublicKeyApi(jwk: JsonWebKey): Promise<void> {
  await api.post('/api/mobile/keys/public', { publicKeyJwk: jwk });
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
