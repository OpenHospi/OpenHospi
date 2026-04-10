import { ActionSheetIOS, Alert, Platform } from 'react-native';
import * as Haptics from 'expo-haptics';

interface ActionSheetOption {
  label: string;
  onPress: () => void;
  destructive?: boolean;
}

/**
 * Shows a native action sheet (iOS) or alert dialog (Android).
 * Automatically fires a selection haptic on open.
 */
export function showActionSheet(
  title: string,
  options: ActionSheetOption[],
  cancelLabel = 'Cancel'
) {
  Haptics.selectionAsync();

  if (Platform.OS === 'ios') {
    const labels = [...options.map((o) => o.label), cancelLabel];
    const destructiveIndex = options.findIndex((o) => o.destructive);

    ActionSheetIOS.showActionSheetWithOptions(
      {
        title,
        options: labels,
        cancelButtonIndex: labels.length - 1,
        destructiveButtonIndex: destructiveIndex >= 0 ? destructiveIndex : undefined,
      },
      (buttonIndex) => {
        if (buttonIndex < options.length) {
          options[buttonIndex].onPress();
        }
      }
    );
  } else {
    Alert.alert(title, undefined, [
      ...options.map((o) => {
        const buttonStyle: 'destructive' | 'default' = o.destructive ? 'destructive' : 'default';
        return { text: o.label, onPress: o.onPress, style: buttonStyle };
      }),
      { text: cancelLabel, style: 'cancel' },
    ]);
  }
}
