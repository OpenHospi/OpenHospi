import { Image } from 'expo-image';
import { Stack, useRouter } from 'expo-router';
import { getInstitution } from '@openhospi/inacademia';
import { SymbolView } from 'expo-symbols';
import { MaterialIcons } from '@expo/vector-icons';
import { useMemo } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { ThemedAvatar } from '@/components/native/avatar';
import { ThemedBadge } from '@/components/native/badge';
import { ThemedSkeleton } from '@/components/native/skeleton';
import { ThemedText } from '@/components/native/text';
import { GroupedSection } from '@/components/layout/grouped-section';
import { ListCell } from '@/components/layout/list-cell';
import { NativeDivider } from '@/components/native/divider';
import { useTheme } from '@/design';
import { radius } from '@/design/tokens/radius';
import { isIOS } from '@/lib/platform';
import { hapticPullToRefreshSnap } from '@/lib/haptics';
import { authClient } from '@/lib/auth-client';
import { queryClient } from '@/lib/query-client';
import { getStoragePublicUrl } from '@/lib/storage-url';
import { useProfile } from '@/services/profile';
import { useNotifications, useMarkNotificationRead } from '@/services/notifications';

export default function ProfileScreen() {
  const { t } = useTranslation('translation', { keyPrefix: 'app.profile' });
  const { t: tEnums } = useTranslation('translation', { keyPrefix: 'enums' });
  const { t: tCommon } = useTranslation('translation', { keyPrefix: 'common.labels' });
  const router = useRouter();
  const { colors } = useTheme();
  const { bottom } = useSafeAreaInsets();

  const { data: profile, isPending, refetch, isRefetching } = useProfile();
  const { i18n } = useTranslation();
  const institution = useMemo(
    () => (profile ? getInstitution(profile.institutionDomain) : null),
    [profile]
  );
  const institutionName = institution
    ? institution.name[i18n.language === 'nl' ? 'nl' : 'en']
    : null;

  const handleRefresh = () => {
    hapticPullToRefreshSnap();
    refetch();
  };

  if (isPending) {
    return (
      <>
        <Stack.Screen options={{ headerTitle: t('title') }} />
        <View style={styles.loadingContainer}>
          <ThemedSkeleton width={96} height={96} circle />
          <View style={styles.loadingLines}>
            <ThemedSkeleton width="50%" height={22} />
            <ThemedSkeleton width="30%" height={14} />
          </View>
        </View>
      </>
    );
  }

  if (!profile) {
    return (
      <>
        <Stack.Screen options={{ headerTitle: t('title') }} />
        <View style={styles.loadingContainer}>
          <ThemedText variant="subheadline" color={colors.tertiaryForeground}>
            Profile not found
          </ThemedText>
        </View>
      </>
    );
  }

  const avatarUrl = profile.avatarUrl
    ? getStoragePublicUrl(profile.avatarUrl, 'profile-photos')
    : null;

  return (
    <>
      <Stack.Screen
        options={{
          headerTitle: t('title'),
          headerRight: () => (
            <Pressable onPress={() => router.push('/(app)/settings')} hitSlop={8}>
              {isIOS ? (
                <SymbolView name="gearshape" size={22} tintColor={colors.tertiaryForeground} />
              ) : (
                <MaterialIcons name="settings" size={22} color={colors.tertiaryForeground} />
              )}
            </Pressable>
          ),
        }}
      />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{ paddingBottom: bottom + 16 }}
        contentInsetAdjustmentBehavior="automatic"
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={handleRefresh} />}>
        {/* Avatar Header */}
        <View style={styles.avatarSection}>
          <ThemedAvatar source={avatarUrl} fallback={profile.firstName} size={96} />
          <ThemedText variant="title2" style={styles.nameText}>
            {profile.firstName} {profile.lastName}
          </ThemedText>
          <View style={styles.badgeRow}>
            {institution && institutionName && (
              <ThemedBadge variant="secondary" label={institution.short} />
            )}
            {profile.vereniging && (
              <ThemedBadge variant="outline" label={tEnums(`vereniging.${profile.vereniging}`)} />
            )}
          </View>
        </View>

        {/* Photos */}
        {profile.photos.length > 0 && (
          <GroupedSection>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.photoRow}>
              {profile.photos.map((photo) => (
                <Image
                  key={photo.id}
                  source={{ uri: getStoragePublicUrl(photo.url, 'profile-photos') }}
                  style={styles.photoThumb}
                  contentFit="cover"
                  cachePolicy="disk"
                />
              ))}
            </ScrollView>
            <NativeDivider />
            <ListCell
              label={tCommon('edit')}
              onPress={() => router.push('/(app)/(modals)/edit-photos')}
            />
          </GroupedSection>
        )}
        {profile.photos.length === 0 && (
          <GroupedSection>
            <ListCell
              label={t('title')}
              value={tCommon('notSet')}
              onPress={() => router.push('/(app)/(modals)/edit-photos')}
            />
          </GroupedSection>
        )}

        {/* Study & Personal */}
        <SectionHeader title={t('studyInfo')} />
        <GroupedSection>
          <ListCell
            label={t('gender')}
            value={profile.gender ? tEnums(`gender.${profile.gender}`) : tCommon('notSet')}
            onPress={() => router.push('/(app)/(modals)/edit-gender')}
          />
          <NativeDivider />
          <ListCell
            label={t('birthDate')}
            value={
              profile.birthDate
                ? new Date(profile.birthDate).toLocaleDateString()
                : tCommon('notSet')
            }
            onPress={() => router.push('/(app)/(modals)/edit-birth-date')}
          />
          <NativeDivider />
          <ListCell
            label={t('studyProgram')}
            value={profile.studyProgram || tCommon('notSet')}
            onPress={() => router.push('/(app)/(modals)/edit-study-program')}
          />
          <NativeDivider />
          <ListCell
            label={t('studyLevel')}
            value={
              profile.studyLevel ? tEnums(`study_level.${profile.studyLevel}`) : tCommon('notSet')
            }
            onPress={() => router.push('/(app)/(modals)/edit-study-level')}
          />
          <NativeDivider />
          <ListCell
            label={t('preferredCity')}
            value={profile.preferredCity || tCommon('notSet')}
            onPress={() => router.push('/(app)/(modals)/edit-preferred-city')}
          />
          <NativeDivider />
          <ListCell
            label={t('vereniging')}
            value={profile.vereniging || tCommon('notSet')}
            onPress={() => router.push('/(app)/(modals)/edit-vereniging')}
          />
        </GroupedSection>

        {/* Bio */}
        <SectionHeader title={t('bio')} />
        <GroupedSection>
          <View style={styles.bioContent}>
            <ThemedText
              variant="body"
              color={profile.bio ? colors.foreground : colors.tertiaryForeground}
              numberOfLines={4}>
              {profile.bio || tCommon('notSet')}
            </ThemedText>
          </View>
          <NativeDivider />
          <ListCell
            label={tCommon('edit')}
            onPress={() => router.push('/(app)/(modals)/edit-bio')}
          />
        </GroupedSection>

        {/* Languages */}
        <SectionHeader title={t('languages')} />
        <GroupedSection>
          <ListCell
            label={t('languages')}
            value={
              (profile.languages ?? []).length > 0
                ? (profile.languages ?? []).map((l) => tEnums(`language_enum.${l}`)).join(', ')
                : tCommon('notSet')
            }
            onPress={() => router.push('/(app)/(modals)/edit-languages')}
          />
        </GroupedSection>

        {/* Lifestyle */}
        <SectionHeader title={t('lifestyleTags')} />
        <GroupedSection>
          <ListCell
            label={t('lifestyleTags')}
            value={
              (profile.lifestyleTags ?? []).length > 0
                ? (profile.lifestyleTags ?? [])
                    .map((tag) => tEnums(`lifestyle_tag.${tag}`))
                    .join(', ')
                : tCommon('notSet')
            }
            onPress={() => router.push('/(app)/(modals)/edit-lifestyle')}
          />
        </GroupedSection>

        {/* Activity */}
        <ActivitySection />

        {/* Account */}
        <SectionHeader title={t('account')} />
        <GroupedSection>
          <ListCell
            label={tCommon('logout')}
            destructive
            onPress={() => {
              queryClient.clear();
              authClient.signOut();
            }}
          />
        </GroupedSection>
      </ScrollView>
    </>
  );
}

function SectionHeader({ title }: { title: string }) {
  const { colors } = useTheme();

  return (
    <View style={styles.sectionHeader}>
      <ThemedText
        variant="footnote"
        color={colors.tertiaryForeground}
        style={styles.sectionHeaderText}>
        {title.toUpperCase()}
      </ThemedText>
    </View>
  );
}

function ActivitySection() {
  const { t } = useTranslation('translation', { keyPrefix: 'app.profile' });
  const { colors } = useTheme();
  const { data, isLoading } = useNotifications();
  const markRead = useMarkNotificationRead();

  const notifications = data?.pages.flatMap((p) => p.notifications) ?? [];

  if (isLoading || notifications.length === 0) return null;

  const recent = notifications.slice(0, 5);

  return (
    <>
      <SectionHeader title={t('activity')} />
      <GroupedSection>
        {recent.map((item, index) => (
          <View key={item.id}>
            {index > 0 && <NativeDivider />}
            <ListCell
              label={item.title}
              value={item.body}
              leftContent={
                isIOS ? (
                  <SymbolView
                    name={item.readAt ? 'bell' : 'bell.fill'}
                    size={16}
                    tintColor={item.readAt ? colors.tertiaryForeground : colors.primary}
                  />
                ) : (
                  <MaterialIcons
                    name="notifications"
                    size={16}
                    color={item.readAt ? colors.tertiaryForeground : colors.primary}
                  />
                )
              }
              onPress={() => {
                if (!item.readAt) markRead.mutate(item.id);
              }}
              chevron={false}
            />
          </View>
        ))}
      </GroupedSection>
    </>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  loadingLines: {
    alignItems: 'center',
    gap: 8,
  },
  avatarSection: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  nameText: {
    marginTop: 12,
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
    marginTop: 8,
  },
  photoRow: {
    flexDirection: 'row',
    gap: 12,
    padding: 16,
  },
  photoThumb: {
    width: 80,
    height: 80,
    borderRadius: radius.md,
  },
  bioContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  sectionHeader: {
    paddingHorizontal: 32,
    paddingTop: 24,
    paddingBottom: 8,
  },
  sectionHeaderText: {
    letterSpacing: 0.5,
  },
});
