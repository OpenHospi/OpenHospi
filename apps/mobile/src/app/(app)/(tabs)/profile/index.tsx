import { Image } from 'expo-image';
import { Stack, useRouter } from 'expo-router';
import { getInstitution } from '@openhospi/inacademia';
import { SymbolView } from 'expo-symbols';
import { MaterialIcons } from '@expo/vector-icons';
import { useMemo } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { isIOS } from '@/lib/platform';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';

import { ThemedAvatar } from '@/components/primitives/themed-avatar';
import { ThemedBadge } from '@/components/primitives/themed-badge';
import { ThemedButton } from '@/components/primitives/themed-button';
import { ThemedSkeleton } from '@/components/primitives/themed-skeleton';
import { ThemedText } from '@/components/primitives/themed-text';
import { ListSeparator } from '@/components/layout/list-separator';
import { ProfileFieldRow } from '@/components/profile/profile-field-row';
import { ProfileSectionCard } from '@/components/profile/profile-section-card';
import { useTheme } from '@/design';
import { radius } from '@/design/tokens/radius';
import { STAGGER_DELAY } from '@/lib/animations';
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
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: bottom + 16 }}
        contentInsetAdjustmentBehavior="automatic"
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={handleRefresh} />}>
        <Animated.View entering={FadeInDown.duration(300)} style={styles.avatarSection}>
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
        </Animated.View>

        <View style={styles.sections}>
          <Animated.View entering={FadeInDown.delay(STAGGER_DELAY).duration(300)}>
            <ProfileSectionCard
              title={t('title')}
              onEdit={() => router.push('/(app)/(modals)/edit-photos')}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.photoRow}>
                  {profile.photos.map((photo) => (
                    <Image
                      key={photo.id}
                      source={{ uri: getStoragePublicUrl(photo.url, 'profile-photos') }}
                      style={styles.photoThumb}
                      contentFit="cover"
                      cachePolicy="disk"
                    />
                  ))}
                </View>
              </ScrollView>
            </ProfileSectionCard>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(STAGGER_DELAY * 2).duration(300)}>
            <ProfileSectionCard title={t('studyInfo')}>
              <View>
                <ProfileFieldRow
                  label={t('gender')}
                  value={profile.gender ? tEnums(`gender.${profile.gender}`) : null}
                  placeholder={tCommon('notSet')}
                  onPress={() => router.push('/(app)/(modals)/edit-gender')}
                />
                <ListSeparator insetLeft={0} />
                <ProfileFieldRow
                  label={t('birthDate')}
                  value={
                    profile.birthDate ? new Date(profile.birthDate).toLocaleDateString() : null
                  }
                  placeholder={tCommon('notSet')}
                  onPress={() => router.push('/(app)/(modals)/edit-birth-date')}
                />
                <ListSeparator insetLeft={0} />
                <ProfileFieldRow
                  label={t('studyProgram')}
                  value={profile.studyProgram || null}
                  placeholder={tCommon('notSet')}
                  onPress={() => router.push('/(app)/(modals)/edit-study-program')}
                />
                <ListSeparator insetLeft={0} />
                <ProfileFieldRow
                  label={t('studyLevel')}
                  value={profile.studyLevel ? tEnums(`study_level.${profile.studyLevel}`) : null}
                  placeholder={tCommon('notSet')}
                  onPress={() => router.push('/(app)/(modals)/edit-study-level')}
                />
                <ListSeparator insetLeft={0} />
                <ProfileFieldRow
                  label={t('preferredCity')}
                  value={profile.preferredCity ? tEnums(`city.${profile.preferredCity}`) : null}
                  placeholder={tCommon('notSet')}
                  onPress={() => router.push('/(app)/(modals)/edit-preferred-city')}
                />
                <ListSeparator insetLeft={0} />
                <ProfileFieldRow
                  label={t('vereniging')}
                  value={profile.vereniging || null}
                  placeholder={tCommon('notSet')}
                  onPress={() => router.push('/(app)/(modals)/edit-vereniging')}
                />
              </View>
            </ProfileSectionCard>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(STAGGER_DELAY * 3).duration(300)}>
            <ProfileSectionCard
              title={t('bio')}
              onEdit={() => router.push('/(app)/(modals)/edit-bio')}>
              <ThemedText variant="body" color={colors.secondaryForeground}>
                {profile.bio || '-'}
              </ThemedText>
            </ProfileSectionCard>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(STAGGER_DELAY * 4).duration(300)}>
            <ProfileSectionCard
              title={t('languages')}
              onEdit={() => router.push('/(app)/(modals)/edit-languages')}>
              <View style={styles.tagRow}>
                {(profile.languages ?? []).map((lang) => (
                  <ThemedBadge
                    key={lang}
                    variant="secondary"
                    label={tEnums(`language_enum.${lang}`)}
                  />
                ))}
              </View>
            </ProfileSectionCard>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(STAGGER_DELAY * 5).duration(300)}>
            <ProfileSectionCard
              title={t('lifestyleTags')}
              onEdit={() => router.push('/(app)/(modals)/edit-lifestyle')}>
              <View style={styles.tagRow}>
                {(profile.lifestyleTags ?? []).map((tag) => (
                  <ThemedBadge
                    key={tag}
                    variant="secondary"
                    label={tEnums(`lifestyle_tag.${tag}`)}
                  />
                ))}
              </View>
            </ProfileSectionCard>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(STAGGER_DELAY * 6).duration(300)}>
            <ActivitySection />
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(STAGGER_DELAY * 7).duration(300)}>
            <View style={styles.logoutWrapper}>
              <ThemedButton
                variant="destructive"
                onPress={() => {
                  queryClient.clear();
                  authClient.signOut();
                }}>
                {tCommon('logout')}
              </ThemedButton>
            </View>
          </Animated.View>
        </View>
      </ScrollView>
    </>
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
    <ProfileSectionCard title={t('activity')}>
      <View style={styles.activityList}>
        {recent.map((item) => (
          <Pressable
            key={item.id}
            onPress={() => {
              if (!item.readAt) markRead.mutate(item.id);
            }}
            style={styles.activityRow}>
            {isIOS ? (
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
            )}
            <View style={styles.activityText}>
              <ThemedText
                variant="subheadline"
                weight={item.readAt ? '400' : '500'}
                color={item.readAt ? colors.tertiaryForeground : colors.foreground}>
                {item.title}
              </ThemedText>
              <ThemedText variant="caption1" color={colors.tertiaryForeground} numberOfLines={2}>
                {item.body}
              </ThemedText>
            </View>
          </Pressable>
        ))}
      </View>
    </ProfileSectionCard>
  );
}

const styles = StyleSheet.create({
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
  sections: {
    gap: 16,
    paddingBottom: 16,
  },
  photoRow: {
    flexDirection: 'row',
    gap: 12,
  },
  photoThumb: {
    width: 80,
    height: 80,
    borderRadius: radius.md,
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  logoutWrapper: {
    paddingHorizontal: 16,
  },
  activityList: {
    gap: 8,
  },
  activityRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  activityText: {
    flex: 1,
  },
});
