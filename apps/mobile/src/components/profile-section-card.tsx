import { Pressable, Text, View } from 'react-native';

import { useTranslation } from 'react-i18next';

type Props = {
  title: string;
  onEdit?: () => void;
  children: React.ReactNode;
};

export function ProfileSectionCard({ title, onEdit, children }: Props) {
  const { t: tCommon } = useTranslation('translation', { keyPrefix: 'common.labels' });

  return (
    <View className="rounded-xl border border-border bg-card p-4">
      <View className="flex-row items-center justify-between pb-2">
        <Text className="text-base font-semibold text-foreground">{title}</Text>
        {onEdit && (
          <Pressable onPress={onEdit}>
            <Text className="text-sm text-primary">{tCommon('edit')}</Text>
          </Pressable>
        )}
      </View>
      {children}
    </View>
  );
}
