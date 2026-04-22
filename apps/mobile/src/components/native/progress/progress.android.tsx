import { View } from 'react-native';
import { Host, LinearProgressIndicator } from '@expo/ui/jetpack-compose';

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
        <LinearProgressIndicator
          progress={value ?? undefined}
          color={colors.primary}
          trackColor={colors.muted}
        />
      </Host>
    </View>
  );
}

export { NativeProgress };
