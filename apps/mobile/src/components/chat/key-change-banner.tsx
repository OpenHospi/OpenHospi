import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { NativeIcon } from '@/components/native/icon';
import { ThemedText } from '@/components/native/text';
import { useTheme } from '@/design';
import { hapticLight } from '@/lib/haptics';

type Props = {
  conversationId: string;
  peerUserId: string;
  peerName: string;
  hasChanged: boolean;
  onDismiss?: () => void;
};

export function KeyChangeBanner({
  conversationId,
  peerUserId,
  peerName,
  hasChanged,
  onDismiss,
}: Props) {
  const { t } = useTranslation('translation', { keyPrefix: 'app.chat.safety_number' });
  const router = useRouter();
  const { colors } = useTheme();

  if (!hasChanged) return null;

  const stripBackground = colors.destructive + '1A';
  const stripBorder = colors.destructive + '33';

  function handleVerify() {
    hapticLight();
    router.push({
      pathname: '/(app)/(tabs)/chat/[conversationId]/verify/[userId]',
      params: { conversationId, userId: peerUserId },
    });
  }

  return (
    <View
      style={[styles.banner, { backgroundColor: stripBackground, borderBottomColor: stripBorder }]}
      accessibilityRole="alert">
      <NativeIcon
        name="exclamationmark.shield.fill"
        androidName="gpp-maybe"
        size={20}
        color={colors.destructive}
      />

      <Pressable
        onPress={handleVerify}
        style={styles.textWrap}
        accessibilityRole="button"
        accessibilityLabel={t('key_changed')}
        accessibilityHint={t('reverify')}>
        <ThemedText variant="subheadline" weight="600" color={colors.destructive}>
          {t('key_changed')}
        </ThemedText>
        <ThemedText
          variant="caption1"
          color={colors.destructive}
          style={styles.description}
          numberOfLines={2}>
          {t('key_changed_description', { name: peerName })}
        </ThemedText>
      </Pressable>

      {onDismiss ? (
        <Pressable
          onPress={onDismiss}
          style={styles.dismiss}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Dismiss">
          <NativeIcon
            name="xmark.circle.fill"
            androidName="cancel"
            size={18}
            color={colors.destructive}
          />
        </Pressable>
      ) : (
        <ThemedText variant="caption1" weight="600" color={colors.destructive}>
          {t('reverify')}
        </ThemedText>
      )}
    </View>
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
  textWrap: {
    flex: 1,
  },
  description: {
    opacity: 0.85,
    marginTop: 2,
  },
  dismiss: {
    padding: 4,
  },
});
