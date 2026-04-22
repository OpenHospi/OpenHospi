import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { GroupedSection } from '@/components/layout/grouped-section';
import { ListCell } from '@/components/layout/list-cell';
import { PlatformSurface } from '@/components/layout/platform-surface';
import { NativeDivider } from '@/components/native/divider';
import { NativeIcon } from '@/components/native/icon';
import { ThemedAvatar } from '@/components/native/avatar';
import { ThemedText } from '@/components/native/text';
import { useTheme } from '@/design';
import { radius } from '@/design/tokens/radius';
import { useSession } from '@/lib/auth-client';
import { hapticDelete, hapticLight } from '@/lib/haptics';
import { useConversationDetail } from '@/services/chat';

export default function ConversationInfoScreen() {
  const { conversationId } = useLocalSearchParams<{ conversationId: string }>();
  const { t } = useTranslation('translation', { keyPrefix: 'app.chat' });
  const { t: tCommon } = useTranslation('translation', { keyPrefix: 'common.labels' });
  const { t: tSafetyNumber } = useTranslation('translation', {
    keyPrefix: 'app.chat.safety_number',
  });
  const { data: session } = useSession();
  const userId = session?.user?.id;
  const { data: detail } = useConversationDetail(conversationId);
  const router = useRouter();
  const { colors, spacing } = useTheme();

  if (!detail) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <ThemedText variant="subheadline" color={colors.tertiaryForeground}>
          {t('loading_messages')}
        </ThemedText>
      </View>
    );
  }

  function handleBlock() {
    Alert.alert(t('block_user'), t('blocked'), [
      { text: tCommon('cancel'), style: 'cancel' },
      {
        text: t('block_user'),
        style: 'destructive',
        onPress: () => {
          hapticDelete();
          Alert.alert(t('block_user'), 'User blocked');
        },
      },
    ]);
  }

  function handleReport() {
    Alert.alert(t('report_message'), t('report_message'), [
      { text: tCommon('cancel'), style: 'cancel' },
      {
        text: t('report_message'),
        style: 'destructive',
        onPress: () => {
          hapticDelete();
          Alert.alert(t('report_message'), 'Report submitted');
        },
      },
    ]);
  }

  function handleViewListing() {
    if (!detail) return;
    hapticLight();
    router.push({ pathname: '/(app)/room/[id]', params: { id: detail.roomId } });
  }

  const otherMembers = detail.members.filter((m) => m.userId !== userId);

  return (
    <>
      <Stack.Screen options={{ headerTitle: t('info') }} />
      <ScrollView
        style={[styles.flex1, { backgroundColor: colors.background }]}
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={{ padding: spacing.lg, gap: spacing.xl }}>
        {/* Header */}
        <View style={styles.headerContainer}>
          <ThemedAvatar
            fallback={detail.roomTitle}
            size={88}
            accessibilityLabel={`${detail.roomTitle} avatar`}
          />
          <ThemedText variant="title3" weight="700" style={styles.textCenter}>
            {detail.roomTitle}
          </ThemedText>
          <View
            style={[styles.encryptedPill, { backgroundColor: colors.primary + '1A' }]}
            accessibilityRole="text"
            accessibilityLabel={t('encrypted')}>
            <NativeIcon name="lock.fill" androidName="lock" size={12} color={colors.primary} />
            <ThemedText variant="caption1" weight="600" color={colors.primary}>
              {t('encrypted')}
            </ThemedText>
          </View>
        </View>

        {/* Room context card */}
        <PlatformSurface variant="card" style={[styles.cardPad, { gap: spacing.md }]}>
          <ThemedText variant="caption1" weight="600" color={colors.tertiaryForeground}>
            {t('room_info').toUpperCase()}
          </ThemedText>
          <ThemedText variant="body" color={colors.foreground}>
            {detail.roomTitle}
          </ThemedText>
          <NativeDivider />
          <ListCell
            label={t('view_listing')}
            icon="arrow.up.right.square"
            onPress={handleViewListing}
            accessibilityHint="Opens room listing"
          />
        </PlatformSurface>

        {/* Members */}
        <GroupedSection header={`${t('members')} (${detail.members.length})`}>
          {detail.members.map((member, index) => {
            const isCurrentUser = member.userId === userId;
            const label = `${member.firstName}${isCurrentUser ? ` (${t('you')})` : ''}`;
            const showDivider = index < detail.members.length - 1;

            return (
              <View key={member.userId}>
                <ListCell
                  label={label}
                  leftContent={
                    <ThemedAvatar
                      fallback={member.firstName}
                      size={32}
                      accessibilityLabel={`${member.firstName} avatar`}
                    />
                  }
                  value={isCurrentUser ? undefined : tSafetyNumber('title')}
                  onPress={
                    isCurrentUser
                      ? undefined
                      : () => {
                          hapticLight();
                          router.push({
                            pathname: '/(app)/(tabs)/chat/[conversationId]/verify/[userId]',
                            params: { conversationId, userId: member.userId },
                          });
                        }
                  }
                  chevron={!isCurrentUser}
                  accessibilityHint={
                    isCurrentUser
                      ? undefined
                      : tSafetyNumber('description', { name: member.firstName })
                  }
                />
                {showDivider ? (
                  <View style={styles.innerDivider}>
                    <NativeDivider />
                  </View>
                ) : null}
              </View>
            );
          })}
        </GroupedSection>

        {/* Actions */}
        <GroupedSection>
          <ListCell
            label={t('mute_conversation')}
            icon="bell.slash"
            onPress={() => {
              hapticLight();
              Alert.alert(t('mute_conversation'));
            }}
          />
          <View style={styles.innerDivider}>
            <NativeDivider />
          </View>
          <ListCell
            label={t('block_user')}
            icon="hand.raised.fill"
            destructive
            onPress={handleBlock}
          />
          <View style={styles.innerDivider}>
            <NativeDivider />
          </View>
          <ListCell
            label={t('report_message')}
            icon="flag.fill"
            destructive
            onPress={handleReport}
          />
        </GroupedSection>

        {otherMembers.length === 1 ? (
          <ThemedText
            variant="caption1"
            color={colors.tertiaryForeground}
            style={styles.textCenter}>
            {tSafetyNumber('description', { name: otherMembers[0].firstName })}
          </ThemedText>
        ) : null}
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  flex1: {
    flex: 1,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textCenter: {
    textAlign: 'center',
  },
  headerContainer: {
    alignItems: 'center',
    gap: 12,
  },
  encryptedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.full,
  },
  cardPad: {
    padding: 16,
  },
  innerDivider: {
    marginStart: 56,
  },
});
