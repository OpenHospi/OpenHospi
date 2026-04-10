import * as Haptics from 'expo-haptics';

// ── Base haptics ──

export const hapticLight = () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
export const hapticMedium = () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
export const hapticHeavy = () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
export const hapticRigid = () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Rigid);
export const hapticSoft = () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Soft);
export const hapticSelection = () => Haptics.selectionAsync();
export const hapticSuccess = () =>
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
export const hapticWarning = () =>
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
export const hapticError = () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);

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
