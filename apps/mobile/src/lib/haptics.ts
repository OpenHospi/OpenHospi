import * as Haptics from 'expo-haptics';

export const hapticLight = () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
export const hapticMedium = () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
export const hapticHeavy = () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
export const hapticSelection = () => Haptics.selectionAsync();
export const hapticSuccess = () =>
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
export const hapticError = () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
