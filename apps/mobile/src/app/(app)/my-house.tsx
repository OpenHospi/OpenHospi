import { HouseMemberRole } from '@openhospi/shared/enums';
import { Stack } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import { Alert, ScrollView, Share, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { ThemedAvatar } from '@/components/native/avatar';
import { ThemedBadge } from '@/components/native/badge';
import { NativeButton } from '@/components/native/button';
import { NativeDivider } from '@/components/native/divider';
import { ThemedSkeleton } from '@/components/native/skeleton';
import { ThemedText } from '@/components/native/text';
import { GroupedSection } from '@/components/layout/grouped-section';
import { ListCell } from '@/components/layout/list-cell';
import { ErrorState } from '@/components/feedback/error-state';
import { NativeEmptyState } from '@/components/feedback/native-empty-state';
import { useTheme } from '@/design';
import { hapticSuccess } from '@/lib/haptics';
import { getStoragePublicUrl } from '@/lib/storage-url';
import { useMyHouse, useRegenerateInviteCode } from '@/services/house';

export default function MyHouseScreen() {
  const { t } = useTranslation('translation', { keyPrefix: 'app.myHouse' });
  const { t: tCommon } = useTranslation('translation', { keyPrefix: 'common.labels' });
  const { t: tEnums } = useTranslation('translation', { keyPrefix: 'enums' });
  const { colors, spacing } = useTheme();
  const { data, isPending, isError, refetch } = useMyHouse();
  const regenerateCode = useRegenerateInviteCode();

  if (isPending) {
    return (
      <>
        <Stack.Screen options={{ title: t('title') }} />
        <ScrollView
          style={styles.flex}
          contentInsetAdjustmentBehavior="automatic"
          contentContainerStyle={[styles.loadingContainer, { gap: spacing.md }]}>
          <ThemedSkeleton width="50%" height={24} />
          <ThemedSkeleton width="30%" height={16} />
          <View
            style={[
              styles.skeletonCards,
              { paddingHorizontal: spacing.lg, gap: spacing.lg, marginTop: spacing['2xl'] },
            ]}>
            <ThemedSkeleton width="100%" height={80} rounded="lg" />
            <ThemedSkeleton width="100%" height={120} rounded="lg" />
          </View>
        </ScrollView>
      </>
    );
  }

  if (isError) {
    return (
      <>
        <Stack.Screen options={{ title: t('title') }} />
        <ErrorState onRetry={refetch} />
      </>
    );
  }

  if (!data?.house) {
    return (
      <>
        <Stack.Screen options={{ title: t('title') }} />
        <NativeEmptyState sfSymbol="person.2" androidIcon="group" title={t('noHouse')} />
      </>
    );
  }

  const { house, members, currentUserRole } = data;
  const isOwner = currentUserRole === HouseMemberRole.owner;
  const inviteLink = `https://openhospi.nl/join/${house.inviteCode}`;

  async function handleCopyCode() {
    await Clipboard.setStringAsync(inviteLink);
    hapticSuccess();
    Alert.alert(tCommon('copied'));
  }

  async function handleShare() {
    hapticSuccess();
    await Share.share({ message: inviteLink });
  }

  return (
    <>
      <Stack.Screen options={{ title: t('title') }} />
      <ScrollView
        style={styles.flex}
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={{ paddingBottom: spacing['3xl'] }}>
        <View style={[styles.headerSection, { paddingVertical: spacing['2xl'], gap: spacing.xs }]}>
          <ThemedText variant="title2">{house.name}</ThemedText>
          <ThemedText variant="subheadline" color={colors.tertiaryForeground}>
            {t('memberCount', { count: members.length })}
          </ThemedText>
        </View>

        <GroupedSection>
          <ListCell
            label={t('inviteCode')}
            value={house.inviteCode}
            onPress={handleCopyCode}
            accessibilityHint={tCommon('copy')}
          />
          <NativeDivider />
          <View
            style={[
              styles.actionRow,
              {
                gap: spacing.sm,
                paddingHorizontal: spacing.lg,
                paddingVertical: spacing.md,
              },
            ]}>
            <NativeButton
              label={tCommon('copy')}
              variant="outline"
              size="sm"
              onPress={handleCopyCode}
              systemImage="doc.on.doc"
              materialIcon="content-copy"
              accessibilityHint={t('inviteCode')}
            />
            <NativeButton
              label={tCommon('share')}
              variant="outline"
              size="sm"
              onPress={handleShare}
              systemImage="square.and.arrow.up"
              materialIcon="share"
              accessibilityHint={t('inviteCode')}
            />
            {isOwner ? (
              <NativeButton
                label={t('regenerate')}
                variant="ghost"
                size="sm"
                onPress={() => regenerateCode.mutate()}
                loading={regenerateCode.isPending}
                systemImage="arrow.clockwise"
                materialIcon="refresh"
              />
            ) : null}
          </View>
        </GroupedSection>

        <GroupedSection header={t('members')} style={{ marginTop: spacing['2xl'] }}>
          {members.map((member, index) => (
            <View key={member.userId}>
              {index > 0 ? <NativeDivider /> : null}
              <View
                style={[
                  styles.memberRow,
                  {
                    gap: spacing.md,
                    paddingHorizontal: spacing.lg,
                    paddingVertical: spacing.md,
                  },
                ]}>
                <ThemedAvatar
                  source={
                    member.avatarUrl
                      ? getStoragePublicUrl(member.avatarUrl, 'profile-photos')
                      : null
                  }
                  fallback={member.firstName}
                  size={40}
                />
                <View style={styles.memberInfo}>
                  <ThemedText variant="body">
                    {member.firstName} {member.lastName}
                  </ThemedText>
                </View>
                <ThemedBadge
                  variant="secondary"
                  label={tEnums(`house_member_role.${member.role}`)}
                />
              </View>
            </View>
          ))}
        </GroupedSection>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingTop: 48,
  },
  skeletonCards: {
    width: '100%',
  },
  headerSection: {
    alignItems: 'center',
  },
  actionRow: {
    flexDirection: 'row',
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 48,
  },
  memberInfo: {
    flex: 1,
  },
});
