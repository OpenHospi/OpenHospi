import * as LocalAuthentication from 'expo-local-authentication';

import { mmkv } from './mmkv';

const BIOMETRIC_ENABLED_KEY = 'biometric_enabled';

export async function isBiometricAvailable(): Promise<boolean> {
  const hasHardware = await LocalAuthentication.hasHardwareAsync();
  const isEnrolled = await LocalAuthentication.isEnrolledAsync();
  return hasHardware && isEnrolled;
}

export function isBiometricEnabled(): boolean {
  return mmkv.getBoolean(BIOMETRIC_ENABLED_KEY) ?? false;
}

export function setBiometricEnabled(enabled: boolean): void {
  mmkv.setBoolean(BIOMETRIC_ENABLED_KEY, enabled);
}

export async function authenticateWithBiometric(): Promise<boolean> {
  const result = await LocalAuthentication.authenticateAsync({
    promptMessage: 'Unlock OpenHospi',
    cancelLabel: 'Cancel',
    disableDeviceFallback: false,
  });
  return result.success;
}
