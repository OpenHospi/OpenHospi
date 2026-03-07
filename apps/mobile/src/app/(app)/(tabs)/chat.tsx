import { Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useTranslations } from '@/i18n';

export default function ChatScreen() {
  const t = useTranslations('common.labels');

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-1 items-center justify-center">
        <Text className="text-2xl font-bold text-foreground">{t('chat')}</Text>
      </View>
    </SafeAreaView>
  );
}
