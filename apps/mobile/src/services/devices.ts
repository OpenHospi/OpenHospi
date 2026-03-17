import { api } from '@/lib/api-client';
import { SecureStorage } from '@/lib/crypto/secure-storage';

const DEVICE_UUID_KEY = 'device_uuid';
const DEVICE_ID_KEY = 'device_id';

type DeviceRegistrationResponse = {
  id: string;
  userId: string;
  deviceId: number;
  registrationId: number;
  identityKeyPublic: string;
  platform: string;
  isActive: boolean;
};

type DeviceInfo = {
  id: string;
  deviceId: number;
  registrationId: number;
  identityKeyPublic: string;
  platform: string;
};

/**
 * Register this device with the server.
 * Returns the server-assigned device UUID and stores it locally.
 */
export async function registerDeviceApi(data: {
  deviceId: number;
  registrationId: number;
  identityKeyPublic: string;
  platform: 'ios' | 'android';
  pushToken?: string;
}): Promise<DeviceRegistrationResponse> {
  const result = await api.post<DeviceRegistrationResponse>('/api/mobile/keys/identity', data);

  // Store device UUID and deviceId locally for future API calls
  await SecureStorage.set(DEVICE_UUID_KEY, result.id);
  await SecureStorage.set(DEVICE_ID_KEY, String(result.deviceId));

  return result;
}

/**
 * Get the locally stored device UUID (server-assigned).
 * Returns null if device hasn't been registered yet.
 */
export async function getLocalDeviceUuid(): Promise<string | null> {
  return SecureStorage.get(DEVICE_UUID_KEY);
}

/**
 * Get the locally stored device ID (per-user integer).
 * Returns null if device hasn't been registered yet.
 */
export async function getLocalDeviceId(): Promise<number | null> {
  const stored = await SecureStorage.get(DEVICE_ID_KEY);
  return stored ? Number(stored) : null;
}

/**
 * Get all active devices for a user.
 */
export async function getDevicesForUserApi(userId: string): Promise<DeviceInfo[]> {
  return api.get<DeviceInfo[]>(`/api/mobile/keys/devices?userId=${userId}`);
}

/**
 * Fetch the pre-key bundle for a specific device (by device UUID).
 */
export async function fetchPreKeyBundleForDeviceApi(deviceUuid: string) {
  return api.get<{
    deviceId: string;
    registrationId: number;
    identityKeyPublic: string;
    signedPreKeyId: number;
    signedPreKeyPublic: string;
    signedPreKeySignature: string;
    oneTimePreKeyId?: number;
    oneTimePreKeyPublic?: string;
  } | null>(`/api/mobile/keys/bundle/${deviceUuid}`);
}
