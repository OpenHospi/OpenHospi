import { StyleSheet, View } from 'react-native';

import { PlatformSurface } from '@/components/layout/platform-surface';
import { ThemedText } from '@/components/native/text';
import { useTheme } from '@/design';

type Props = {
  date: Date;
  locale: string;
  labels: { today: string; yesterday: string };
};

export function formatDateSeparator(
  date: Date,
  locale: string,
  labels: { today: string; yesterday: string }
): string {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const msgDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const diffDays = Math.round((today.getTime() - msgDay.getTime()) / 86_400_000);

  if (diffDays === 0) return labels.today;
  if (diffDays === 1) return labels.yesterday;
  if (diffDays < 7) {
    return date.toLocaleDateString(locale, { weekday: 'long' });
  }
  return date.toLocaleDateString(locale, { day: 'numeric', month: 'long', year: 'numeric' });
}

export function DateSeparator({ date, locale, labels }: Props) {
  const { colors } = useTheme();
  const label = formatDateSeparator(date, locale, labels);

  return (
    <View style={styles.container} accessibilityRole="header" accessibilityLabel={label}>
      <PlatformSurface variant="card" style={styles.pill}>
        <ThemedText variant="caption1" weight="500" color={colors.secondaryForeground}>
          {label}
        </ThemedText>
      </PlatformSurface>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  pill: {
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
});
