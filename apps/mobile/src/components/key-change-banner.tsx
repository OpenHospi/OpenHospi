import { useRouter } from 'expo-router';
import { ShieldAlert } from 'lucide-react-native';
import { Pressable, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { useTheme } from '@/design';
import { ThemedText } from '@/components/primitives/themed-text';

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
  const { colors } = useTheme();

  if (!hasChanged) return null;

  return (
    <Pressable
      onPress={() =>
        router.push({
          pathname: '/(app)/(tabs)/chat/[conversationId]/verify/[userId]',
          params: { conversationId, userId: peerUserId },
        })
      }
      style={[
        styles.banner,
        {
          borderBottomColor: colors.destructive + '33',
          backgroundColor: colors.destructive + '1A',
        },
      ]}>
      <ShieldAlert size={20} color={colors.destructive} />
      <View style={{ flex: 1 }}>
        <ThemedText variant="subheadline" weight="500" color={colors.destructive}>
          {t('key_changed')}
        </ThemedText>
        <ThemedText variant="caption1" color={colors.destructive} style={{ opacity: 0.7 }}>
          {t('key_changed_description', { name: peerName })}
        </ThemedText>
      </View>
      <ThemedText variant="caption1" weight="600" color={colors.destructive}>
        {t('reverify')}
      </ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
});
