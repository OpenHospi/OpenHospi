import * as Device from 'expo-device';
import * as Haptics from 'expo-haptics';

const isRealDevice = Device.isDevice;

function noop() {}

// ── Base haptics (disabled on simulator/emulator) ──

export const hapticLight = isRealDevice
  ? () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
  : noop;
export const hapticMedium = isRealDevice
  ? () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
  : noop;
export const hapticHeavy = isRealDevice
  ? () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy)
  : noop;
export const hapticRigid = isRealDevice
  ? () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Rigid)
  : noop;
export const hapticSoft = isRealDevice
  ? () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Soft)
  : noop;
export const hapticSelection = isRealDevice ? () => Haptics.selectionAsync() : noop;
export const hapticSuccess = isRealDevice
  ? () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
  : noop;
export const hapticWarning = isRealDevice
  ? () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning)
  : noop;
export const hapticError = isRealDevice
  ? () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)
  : noop;

// ── Contextual haptics (use these in screens) ──

/** Tab bar press */
export const hapticTab = hapticLight;
/** Switch / checkbox toggle */
export const hapticToggle = hapticLight;
/** Pull-to-refresh snap point */
export const hapticPullToRefreshSnap = hapticMedium;
/** Bottom sheet snaps to a new detent */
export const hapticSheetSnap = hapticLight;
/** Destructive action confirmation (delete, block, close room) */
export const hapticDelete = hapticWarning;
/** Form submitted successfully */
export const hapticFormSubmitSuccess = hapticSuccess;
/** Form submission failed */
export const hapticFormSubmitError = hapticError;
/** Pinch zoom crossing a scale threshold */
export const hapticZoom = hapticRigid;
/** PIN digit entered */
export const hapticPinEntry = hapticSoft;
