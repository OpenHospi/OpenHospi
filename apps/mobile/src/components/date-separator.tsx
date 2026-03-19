import { View } from 'react-native';

import { Text } from '@/components/ui/text';

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
  return (
    <View style={{ alignItems: 'center', paddingVertical: 12 }}>
      <View
        style={{ borderRadius: 12, paddingHorizontal: 12, paddingVertical: 4 }}
        className="bg-muted">
        <Text className="text-muted-foreground text-xs">
          {formatDateSeparator(date, locale, labels)}
        </Text>
      </View>
    </View>
  );
}
