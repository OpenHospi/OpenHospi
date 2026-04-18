import { Platform } from 'react-native';
import { isGlassEffectAPIAvailable as isGlassEffectAPIAvailableNative } from 'expo-glass-effect';

/**
 * Runtime capability flags for the mobile app.
 *
 * These gate optional-on-new-OS features (iOS 26 Liquid Glass, Android 12 Material You)
 * without branching on `Platform.OS` at the call site.
 */

/**
 * iOS 26+ Liquid Glass API is available at runtime.
 * Guards against crashes on early iOS 26 betas that ship without the API (expo/expo#40911).
 */
export function isGlassEffectAPIAvailable(): boolean {
  return Platform.OS === 'ios' && isGlassEffectAPIAvailableNative();
}

/** Android 12+ supports wallpaper-derived Material You dynamic color. */
export function isMaterialYouAvailable(): boolean {
  return Platform.OS === 'android' && Platform.Version >= 31;
}

/** Expo SDK 54+ ships edge-to-edge by default on Android. */
export function isEdgeToEdgeNative(): boolean {
  return Platform.OS === 'android';
}

/**
 * Predictive back gesture is available on Android 13+ (API 33).
 * System back-to-home and cross-activity animations ship from Android 14/15+.
 * Opt-in is controlled by `android.predictiveBackGestureEnabled: true` in app.config.ts,
 * which sets `android:enableOnBackInvokedCallback="true"` in AndroidManifest.xml.
 */
export function isPredictiveBackAvailable(): boolean {
  return Platform.OS === 'android' && Platform.Version >= 33;
}
