import { useRouter } from 'expo-router';
import { ShieldAlert } from 'lucide-react-native';
import { Pressable, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Text } from '@/components/ui/text';

type Props = {
  conversationId: string;
  peerUserId: string;
  peerName: string;
  hasChanged: boolean;
};

export function KeyChangeBanner({ conversationId, peerUserId, peerName, hasChanged }: Props) {
  const { t } = useTranslation('translation', {
    keyPrefix: 'app.chat.safety_number',
  });
  const router = useRouter();

  if (!hasChanged) return null;

  return (
    <Pressable
      onPress={() => router.push(`/chat/${conversationId}/verify/${peerUserId}`)}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingHorizontal: 16,
        paddingVertical: 12,
      }}
      className="border-destructive/20 bg-destructive/10 border-b">
      <ShieldAlert size={20} className="text-destructive" />
      <View style={{ flex: 1 }}>
        <Text className="text-destructive text-sm font-medium">{t('key_changed')}</Text>
        <Text className="text-destructive/70 text-xs">
          {t('key_changed_description', { name: peerName })}
        </Text>
      </View>
      <Text className="text-destructive text-xs font-semibold">{t('reverify')}</Text>
    </Pressable>
  );
}
