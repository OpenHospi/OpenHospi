import { DateTimePicker } from '@expo/ui/datetimepicker';
import { BottomSheetTextInput, type BottomSheetModal } from '@gorhom/bottom-sheet';
import { getInstitution } from '@openhospi/inacademia';
import { Gender, StudyLevel } from '@openhospi/shared/enums';
import { Image } from 'expo-image';
import { Stack, useRouter } from 'expo-router';
import { useMemo, useRef, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { GroupedSection } from '@/components/layout/grouped-section';
import { ListCell } from '@/components/layout/list-cell';
import { ThemedAvatar } from '@/components/native/avatar';
import { ThemedBadge } from '@/components/native/badge';
import { NativeButton } from '@/components/native/button';
import { NativeDivider } from '@/components/native/divider';
import { NativeIcon } from '@/components/native/icon';
import { ThemedSkeleton } from '@/components/native/skeleton';
import { ThemedText } from '@/components/native/text';
import { AppBottomSheetModal as BottomSheet } from '@/components/shared/bottom-sheet';
import { useTheme } from '@/design';
import { radius } from '@/design/tokens/radius';
import { authClient } from '@/lib/auth-client';
import { showActionSheet } from '@/lib/action-sheet';
import {
  hapticFormSubmitError,
  hapticFormSubmitSuccess,
  hapticLight,
  hapticPullToRefreshSnap,
} from '@/lib/haptics';
import { queryClient } from '@/lib/query-client';
import { getStoragePublicUrl } from '@/lib/storage-url';
import { useMarkNotificationRead, useNotifications } from '@/services/notifications';
import { useProfile, useUpdateProfile } from '@/services/profile';

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
                <NativeIcon
                  name={item.readAt ? 'bell' : 'bell.fill'}
                  size={16}
                  color={item.readAt ? colors.tertiaryForeground : colors.primary}
                />
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

export default function ProfileScreen() {
  const { t } = useTranslation('translation', { keyPrefix: 'app.profile' });
  const { t: tEnums } = useTranslation('translation', { keyPrefix: 'enums' });
  const { t: tCommon } = useTranslation('translation', { keyPrefix: 'common.labels' });
  const router = useRouter();
  const { colors } = useTheme();
  const { bottom } = useSafeAreaInsets();
  const { i18n } = useTranslation();

  const { data: profile, isPending, refetch, isRefetching } = useProfile();
  const updateProfile = useUpdateProfile();

  const birthDateSheetRef = useRef<BottomSheetModal>(null);
  const studyProgramSheetRef = useRef<BottomSheetModal>(null);
  const [birthDateDraft, setBirthDateDraft] = useState<Date>(() => {
    if (profile?.birthDate) {
      const parsed = new Date(profile.birthDate);
      if (!isNaN(parsed.getTime())) return parsed;
    }
    return new Date(2000, 0, 1);
  });
  const [studyProgramDraft, setStudyProgramDraft] = useState('');

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

  const headerOptions = {
    headerTitle: t('title'),
    headerRight: () => (
      <Pressable
        onPress={() => {
          hapticLight();
          router.push('/(app)/settings');
        }}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel={tCommon('settings')}>
        <NativeIcon
          name="gearshape"
          androidName="settings"
          size={22}
          color={colors.tertiaryForeground}
        />
      </Pressable>
    ),
  };

  if (isPending) {
    return (
      <>
        <Stack.Screen options={headerOptions} />
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
        <Stack.Screen options={headerOptions} />
        <View style={styles.loadingContainer}>
          <ThemedText variant="subheadline" color={colors.tertiaryForeground}>
            {t('title')}
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
      <Stack.Screen options={headerOptions} />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{ paddingBottom: bottom + 16 }}
        contentInsetAdjustmentBehavior="automatic"
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={handleRefresh} />}>
        <View style={styles.avatarSection}>
          <ThemedAvatar source={avatarUrl} fallback={profile.firstName} size={96} />
          <ThemedText variant="title2" style={styles.nameText}>
            {profile.firstName} {profile.lastName}
          </ThemedText>
          <View style={styles.badgeRow}>
            {institution && institutionName ? (
              <ThemedBadge variant="secondary" label={institution.short} />
            ) : null}
            {profile.vereniging ? (
              <ThemedBadge variant="outline" label={tEnums(`vereniging.${profile.vereniging}`)} />
            ) : null}
          </View>
        </View>

        {profile.photos.length > 0 ? (
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
        ) : (
          <GroupedSection>
            <ListCell
              label={t('title')}
              value={tCommon('notSet')}
              onPress={() => router.push('/(app)/(modals)/edit-photos')}
            />
          </GroupedSection>
        )}

        <SectionHeader title={t('studyInfo')} />
        <GroupedSection>
          <ListCell
            label={t('gender')}
            value={profile.gender ? tEnums(`gender.${profile.gender}`) : tCommon('notSet')}
            onPress={() => {
              showActionSheet(
                t('gender'),
                Gender.values.map((g) => ({
                  label: tEnums(`gender.${g}`),
                  onPress: () =>
                    updateProfile.mutate({ gender: g }, { onSuccess: hapticFormSubmitSuccess }),
                })),
                tCommon('cancel')
              );
            }}
          />
          <NativeDivider />
          <ListCell
            label={t('birthDate')}
            value={
              profile.birthDate
                ? new Date(profile.birthDate).toLocaleDateString()
                : tCommon('notSet')
            }
            onPress={() => {
              setBirthDateDraft(
                profile.birthDate ? new Date(profile.birthDate) : new Date(2000, 0, 1)
              );
              birthDateSheetRef.current?.present();
            }}
          />
          <NativeDivider />
          <ListCell
            label={t('studyProgram')}
            value={profile.studyProgram || tCommon('notSet')}
            onPress={() => {
              setStudyProgramDraft(profile.studyProgram || '');
              studyProgramSheetRef.current?.present();
            }}
          />
          <NativeDivider />
          <ListCell
            label={t('studyLevel')}
            value={
              profile.studyLevel ? tEnums(`study_level.${profile.studyLevel}`) : tCommon('notSet')
            }
            onPress={() => {
              showActionSheet(
                t('studyLevel'),
                StudyLevel.values.map((sl) => ({
                  label: tEnums(`study_level.${sl}`),
                  onPress: () =>
                    updateProfile.mutate(
                      { studyLevel: sl },
                      { onSuccess: hapticFormSubmitSuccess }
                    ),
                })),
                tCommon('cancel')
              );
            }}
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

        <ActivitySection />

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

      <BottomSheet
        ref={birthDateSheetRef}
        title={t('birthDate')}
        onClose={() => birthDateSheetRef.current?.dismiss()}
        snapPoints={['60%']}
        enableDynamicSizing={false}
        footer={
          <View style={styles.sheetFooter}>
            <NativeButton
              label={tCommon('cancel')}
              variant="outline"
              style={styles.footerButton}
              onPress={() => birthDateSheetRef.current?.dismiss()}
            />
            <NativeButton
              label={tCommon('save')}
              style={styles.footerButton}
              loading={updateProfile.isPending}
              onPress={() => {
                const y = birthDateDraft.getFullYear();
                const m = String(birthDateDraft.getMonth() + 1).padStart(2, '0');
                const d = String(birthDateDraft.getDate()).padStart(2, '0');
                updateProfile.mutate(
                  { birthDate: `${y}-${m}-${d}` },
                  {
                    onSuccess: () => {
                      hapticFormSubmitSuccess();
                      birthDateSheetRef.current?.dismiss();
                    },
                    onError: () => hapticFormSubmitError(),
                  }
                );
              }}
            />
          </View>
        }>
        <View style={styles.datePickerContainer}>
          <DateTimePicker
            value={birthDateDraft}
            mode="date"
            display="inline"
            maximumDate={new Date()}
            minimumDate={new Date(1950, 0, 1)}
            onValueChange={(_event, selectedDate) => setBirthDateDraft(selectedDate)}
          />
        </View>
      </BottomSheet>

      <BottomSheet
        ref={studyProgramSheetRef}
        title={t('studyProgram')}
        onClose={() => studyProgramSheetRef.current?.dismiss()}
        snapPoints={['35%']}
        enableDynamicSizing={false}
        footer={
          <View style={styles.sheetFooter}>
            <NativeButton
              label={tCommon('cancel')}
              variant="outline"
              style={styles.footerButton}
              onPress={() => studyProgramSheetRef.current?.dismiss()}
            />
            <NativeButton
              label={tCommon('save')}
              style={styles.footerButton}
              loading={updateProfile.isPending}
              onPress={() => {
                const trimmed = studyProgramDraft.trim();
                updateProfile.mutate(
                  { studyProgram: trimmed || undefined },
                  {
                    onSuccess: () => {
                      hapticFormSubmitSuccess();
                      studyProgramSheetRef.current?.dismiss();
                    },
                    onError: () => hapticFormSubmitError(),
                  }
                );
              }}
            />
          </View>
        }>
        <View style={styles.studyProgramSheet}>
          <BottomSheetTextInput
            placeholder={t('studyProgram')}
            value={studyProgramDraft}
            onChangeText={setStudyProgramDraft}
            autoFocus
            autoCapitalize="words"
            autoCorrect={false}
            clearButtonMode="while-editing"
            placeholderTextColor={colors.tertiaryForeground}
            style={[
              styles.studyProgramInput,
              {
                color: colors.foreground,
                backgroundColor: colors.secondaryBackground,
                borderColor: colors.separator,
              },
            ]}
          />
        </View>
      </BottomSheet>
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
  datePickerContainer: {
    paddingHorizontal: 8,
  },
  sheetFooter: {
    flexDirection: 'row',
    gap: 12,
  },
  footerButton: {
    flex: 1,
  },
  studyProgramSheet: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  studyProgramInput: {
    height: 44,
    paddingHorizontal: 12,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    fontSize: 16,
  },
});
