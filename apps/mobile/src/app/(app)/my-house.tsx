import { Stack } from 'expo-router';
import { Copy, RefreshCw, Share2, Users } from 'lucide-react-native';
import { Alert, Platform, Pressable, ScrollView, Share, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import * as Clipboard from 'expo-clipboard';

import { ThemedAvatar } from '@/components/primitives/themed-avatar';
import { ThemedBadge } from '@/components/primitives/themed-badge';
import { ThemedButton } from '@/components/primitives/themed-button';
import { ThemedSkeleton } from '@/components/primitives/themed-skeleton';
import { ThemedText } from '@/components/primitives/themed-text';
import { GroupedSection } from '@/components/layout/grouped-section';
import { ListCell } from '@/components/layout/list-cell';
import { ListSeparator } from '@/components/layout/list-separator';
import { NativeEmptyState } from '@/components/feedback/native-empty-state';
import { ErrorState } from '@/components/error-state';
import { useTheme } from '@/design';
import { hapticSuccess } from '@/lib/haptics';
import { useMyHouse, useRegenerateInviteCode } from '@/services/house';
import { getStoragePublicUrl } from '@/lib/storage-url';
import { HouseMemberRole } from '@openhospi/shared/enums';

export default function MyHouseScreen() {
  const { t } = useTranslation('translation', { keyPrefix: 'app.myHouse' });
  const { t: tCommon } = useTranslation('translation', { keyPrefix: 'common.labels' });
  const { t: tEnums } = useTranslation('translation', { keyPrefix: 'enums' });
  const { colors } = useTheme();
  const { data, isPending, isError, refetch } = useMyHouse();
  const regenerateCode = useRegenerateInviteCode();

  if (isPending) {
    return (
      <>
        <Stack.Screen options={{ title: t('title') }} />
        <View style={styles.loadingContainer}>
          <ThemedSkeleton width="50%" height={24} />
          <ThemedSkeleton width="30%" height={16} />
          <View style={styles.skeletonCards}>
            <ThemedSkeleton width="100%" height={80} rounded="lg" />
            <ThemedSkeleton width="100%" height={120} rounded="lg" />
          </View>
        </View>
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
        <NativeEmptyState sfSymbol="person.2" icon={Users} title={t('noHouse')} />
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
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        <View style={styles.headerSection}>
          <ThemedText variant="title2">{house.name}</ThemedText>
          <ThemedText variant="subheadline" color={colors.tertiaryForeground}>
            {t('memberCount', { count: members.length })}
          </ThemedText>
        </View>

        <GroupedSection>
          <ListCell label={t('inviteCode')} value={house.inviteCode} onPress={handleCopyCode} />
          <ListSeparator />
          <View style={styles.actionRow}>
            <ThemedButton variant="outline" size="sm" onPress={handleCopyCode}>
              <Copy size={16} color={colors.foreground} />
              <ThemedText variant="footnote" weight="500">
                {tCommon('copy')}
              </ThemedText>
            </ThemedButton>
            <ThemedButton variant="outline" size="sm" onPress={handleShare}>
              <Share2 size={16} color={colors.foreground} />
              <ThemedText variant="footnote" weight="500">
                {tCommon('share')}
              </ThemedText>
            </ThemedButton>
            {isOwner && (
              <ThemedButton variant="ghost" size="sm" onPress={() => regenerateCode.mutate()}>
                <RefreshCw size={16} color={colors.tertiaryForeground} />
              </ThemedButton>
            )}
          </View>
        </GroupedSection>

        <View style={styles.membersHeader}>
          <ThemedText
            variant="footnote"
            color={colors.tertiaryForeground}
            style={styles.sectionTitle}>
            {t('members').toUpperCase()}
          </ThemedText>
        </View>

        <GroupedSection>
          {members.map((member, index) => (
            <View key={member.userId}>
              {index > 0 && <ListSeparator insetLeft={72} />}
              <View style={styles.memberRow}>
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
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    paddingTop: 48,
    gap: 12,
  },
  skeletonCards: {
    width: '100%',
    paddingHorizontal: 16,
    gap: 16,
    marginTop: 24,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 32,
  },
  headerSection: {
    alignItems: 'center',
    paddingVertical: 24,
    gap: 4,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  membersHeader: {
    paddingHorizontal: 32,
    paddingTop: 24,
    paddingBottom: 8,
  },
  sectionTitle: {
    letterSpacing: 0.5,
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    minHeight: Platform.select({ ios: 44, android: 48 }),
  },
  memberInfo: {
    flex: 1,
  },
});
