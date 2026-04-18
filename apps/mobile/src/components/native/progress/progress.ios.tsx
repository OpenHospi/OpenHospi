import { View } from 'react-native';
import { Host, ProgressView } from '@expo/ui/swift-ui';
import { tint } from '@expo/ui/swift-ui/modifiers';

import { useTheme } from '@/design';

import type { NativeProgressProps } from './progress.types';

function NativeProgress({
  value,
  style,
  accessibilityRole,
  accessibilityLabel,
  accessibilityHint,
  accessibilityState,
  accessibilityValue,
}: NativeProgressProps) {
  const { colors } = useTheme();
  const percent = value != null ? Math.round(Math.max(0, Math.min(1, value)) * 100) : undefined;

  return (
    <View
      style={style}
      accessibilityRole={accessibilityRole ?? 'progressbar'}
      accessibilityLabel={accessibilityLabel ?? 'Progress'}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ busy: value == null, ...(accessibilityState ?? {}) }}
      accessibilityValue={
        accessibilityValue ??
        (percent != null ? { min: 0, max: 100, now: percent, text: `${percent}%` } : undefined)
      }>
      <Host style={{ alignSelf: 'stretch' }}>
        <ProgressView value={value ?? undefined} modifiers={[tint(colors.primary)] as never} />
      </Host>
    </View>
  );
}

export { NativeProgress };
