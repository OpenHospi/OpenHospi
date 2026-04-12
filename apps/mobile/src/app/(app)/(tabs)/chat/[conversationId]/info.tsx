import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ban, BellOff, ChevronRight, Flag, Shield } from 'lucide-react-native';
import { Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { ThemedAvatar } from '@/components/primitives/themed-avatar';
import { ThemedText } from '@/components/primitives/themed-text';
import { useTheme } from '@/design';
import { radius } from '@/design/tokens/radius';
import { useSession } from '@/lib/auth-client';
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
  const { colors } = useTheme();

  if (!detail) {
    return (
      <View style={styles.centered}>
        <ThemedText variant="subheadline" color={colors.tertiaryForeground}>
          {t('loading_messages')}
        </ThemedText>
      </View>
    );
  }

  const initial = detail.roomTitle.charAt(0).toUpperCase();

  function handleBlock() {
    Alert.alert(t('block_user'), t('blocked'), [
      { text: tCommon('cancel'), style: 'cancel' },
      {
        text: t('block_user'),
        style: 'destructive',
        onPress: () => Alert.alert(t('block_user'), 'User blocked'),
      },
    ]);
  }

  function handleReport() {
    Alert.alert(t('report_message'), t('report_message'), [
      { text: tCommon('cancel'), style: 'cancel' },
      {
        text: t('report_message'),
        style: 'destructive',
        onPress: () => Alert.alert(t('report_message'), 'Report submitted'),
      },
    ]);
  }

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      style={[styles.flex1, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.scrollContent}>
      {/* Header */}
      <View style={styles.headerContainer}>
        <ThemedAvatar fallback={initial} size={80} />
        <ThemedText variant="headline">{detail.roomTitle}</ThemedText>
        <View style={styles.encryptedRow}>
          <Shield size={14} color={colors.primary} />
          <ThemedText variant="caption1" color={colors.tertiaryForeground}>
            {t('encrypted')}
          </ThemedText>
        </View>
      </View>

      {/* Room info card */}
      <View
        style={[styles.roomInfoCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <ThemedText variant="subheadline" weight="600">
          {t('room_info')}
        </ThemedText>
        <ThemedText variant="subheadline" color={colors.tertiaryForeground}>
          {detail.roomTitle}
        </ThemedText>
        <Pressable
          onPress={() =>
            router.push({ pathname: '/(app)/room/[id]', params: { id: detail.roomId } })
          }
          style={[styles.viewListingButton, { borderColor: colors.border }]}>
          <ThemedText variant="subheadline" weight="500" color={colors.primary}>
            {t('view_listing')}
          </ThemedText>
        </Pressable>
      </View>

      {/* Members */}
      <View style={styles.membersSection}>
        <ThemedText
          variant="caption1"
          weight="500"
          color={colors.tertiaryForeground}
          style={styles.sectionLabel}>
          {t('members')} ({detail.members.length})
        </ThemedText>
        {detail.members.map((member) => {
          const isCurrentUser = member.userId === userId;

          const row = (
            <View style={styles.memberRow}>
              <ThemedAvatar fallback={member.firstName.charAt(0).toUpperCase()} size={32} />
              <View style={styles.flex1}>
                <ThemedText variant="subheadline">
                  {member.firstName}
                  {isCurrentUser && (
                    <ThemedText variant="caption1" color={colors.tertiaryForeground}>
                      {' '}
                      ({t('you')})
                    </ThemedText>
                  )}
                </ThemedText>
                {!isCurrentUser && (
                  <ThemedText variant="caption1" color={colors.tertiaryForeground}>
                    {tSafetyNumber('title')}
                  </ThemedText>
                )}
              </View>
              {!isCurrentUser && <ChevronRight size={16} color={colors.tertiaryForeground} />}
            </View>
          );

          if (isCurrentUser) return <View key={member.userId}>{row}</View>;

          return (
            <Pressable
              key={member.userId}
              onPress={() =>
                router.push({
                  pathname: '/(app)/(tabs)/chat/[conversationId]/verify/[userId]',
                  params: { conversationId, userId: member.userId },
                })
              }>
              {row}
            </Pressable>
          );
        })}
      </View>

      {/* Actions */}
      <View style={styles.actionsSection}>
        <Pressable style={styles.actionRow} onPress={() => Alert.alert(t('mute_conversation'))}>
          <BellOff size={20} color={colors.tertiaryForeground} />
          <ThemedText variant="subheadline">{t('mute_conversation')}</ThemedText>
        </Pressable>

        <Pressable style={styles.actionRow} onPress={handleBlock}>
          <Ban size={20} color={colors.destructive} />
          <ThemedText variant="subheadline" color={colors.destructive}>
            {t('block_user')}
          </ThemedText>
        </Pressable>

        <Pressable style={styles.actionRow} onPress={handleReport}>
          <Flag size={20} color={colors.destructive} />
          <ThemedText variant="subheadline" color={colors.destructive}>
            {t('report_message')}
          </ThemedText>
        </Pressable>
      </View>
    </ScrollView>
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
  scrollContent: {
    padding: 24,
    gap: 24,
  },
  headerContainer: {
    alignItems: 'center',
    gap: 12,
  },
  encryptedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  roomInfoCard: {
    borderRadius: radius.lg,
    padding: 16,
    gap: 12,
    borderWidth: 1,
  },
  viewListingButton: {
    borderRadius: radius.md,
    paddingVertical: 10,
    alignItems: 'center',
    borderWidth: 1,
  },
  membersSection: {
    gap: 12,
  },
  sectionLabel: {
    textTransform: 'uppercase',
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  actionsSection: {
    gap: 2,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 4,
  },
});
