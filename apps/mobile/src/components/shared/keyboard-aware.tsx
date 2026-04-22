import type { ReactNode } from 'react';
import { KeyboardAvoidingView, type ViewStyle } from 'react-native';

import { isIOS } from '@/lib/platform';

type KeyboardAwareProps = {
  children: ReactNode;
  style?: ViewStyle;
  /** Vertical offset from the top of the screen (e.g. header height). */
  keyboardVerticalOffset?: number;
};

export function KeyboardAware({ children, style, keyboardVerticalOffset }: KeyboardAwareProps) {
  return (
    <KeyboardAvoidingView
      style={[{ flex: 1 }, style]}
      behavior={isIOS ? 'padding' : 'height'}
      keyboardVerticalOffset={keyboardVerticalOffset}>
      {children}
    </KeyboardAvoidingView>
  );
}
