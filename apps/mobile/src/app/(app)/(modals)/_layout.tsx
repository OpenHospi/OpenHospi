import { Stack, useRouter } from 'expo-router';
import { Pressable } from 'react-native';
import { useTranslation } from 'react-i18next';

import { NativeIcon } from '@/components/native/icon';
import { useTheme } from '@/design';

export default function ModalsLayout() {
  const router = useRouter();
  const { colors } = useTheme();
  const { t: tCommon } = useTranslation('translation', { keyPrefix: 'common.labels' });
  const { t: tDiscover } = useTranslation('translation', { keyPrefix: 'app.discover' });
  const { t: tOnboarding } = useTranslation('translation', { keyPrefix: 'app.onboarding' });
  const { t: tProfile } = useTranslation('translation', { keyPrefix: 'app.profile' });
  const { t: tSettings } = useTranslation('translation', { keyPrefix: 'app.settings' });
  const { t: tInvitations } = useTranslation('translation', { keyPrefix: 'app.invitations' });

  return (
    <Stack
      screenOptions={{
        presentation: 'formSheet',
        sheetGrabberVisible: true,
        sheetCornerRadius: 16,
        headerRight: () => (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={tCommon('close')}
            onPress={() => router.back()}
            hitSlop={8}>
            <NativeIcon name="xmark" size={22} color={colors.tertiaryForeground} />
          </Pressable>
        ),
      }}>
      <Stack.Screen
        name="apply-sheet"
        options={{
          sheetAllowedDetents: [0.6],
          title: tCommon('apply'),
        }}
      />
      <Stack.Screen
        name="filter-sheet"
        options={{
          sheetAllowedDetents: [0.85, 1],
          title: tDiscover('filters.title'),
        }}
      />
      <Stack.Screen
        name="edit-gender"
        options={{
          sheetAllowedDetents: [0.35],
          title: tProfile('gender'),
        }}
      />
      <Stack.Screen
        name="edit-birth-date"
        options={{
          sheetAllowedDetents: [0.45],
          title: tProfile('birthDate'),
        }}
      />
      <Stack.Screen
        name="edit-study-program"
        options={{
          sheetAllowedDetents: [0.35],
          title: tProfile('studyProgram'),
        }}
      />
      <Stack.Screen
        name="edit-study-level"
        options={{
          sheetAllowedDetents: [0.45],
          title: tProfile('studyLevel'),
        }}
      />
      <Stack.Screen
        name="edit-preferred-city"
        options={{
          sheetAllowedDetents: [0.7, 1],
          title: tProfile('preferredCity'),
        }}
      />
      <Stack.Screen
        name="edit-vereniging"
        options={{
          sheetAllowedDetents: [0.7, 1],
          title: tProfile('vereniging'),
        }}
      />
      <Stack.Screen
        name="edit-bio"
        options={{
          sheetAllowedDetents: [0.5],
          title: tOnboarding('fields.bio'),
        }}
      />
      <Stack.Screen
        name="edit-languages"
        options={{
          sheetAllowedDetents: [0.7, 1],
          title: tOnboarding('steps.languages'),
        }}
      />
      <Stack.Screen
        name="edit-lifestyle"
        options={{
          sheetAllowedDetents: [0.7, 1],
          title: tOnboarding('steps.personality'),
        }}
      />
      <Stack.Screen
        name="edit-photos"
        options={{
          sheetAllowedDetents: [0.7, 1],
          title: tProfile('title'),
        }}
      />
      <Stack.Screen
        name="key-recovery"
        options={{
          sheetAllowedDetents: [0.7, 1],
          title: tOnboarding('steps.security'),
        }}
      />
      <Stack.Screen
        name="settings-language"
        options={{
          sheetAllowedDetents: [0.45],
          title: tCommon('language'),
        }}
      />
      <Stack.Screen
        name="settings-calendar"
        options={{
          sheetAllowedDetents: [0.55],
          title: tSettings('calendar.title'),
        }}
      />
      <Stack.Screen
        name="settings-data-request"
        options={{
          sheetAllowedDetents: [0.85, 1],
          title: tSettings('privacy.dataRequest.title'),
        }}
      />
      <Stack.Screen
        name="settings-processing-restriction"
        options={{
          sheetAllowedDetents: [0.6],
          title: tSettings('privacy.processingRestriction.title'),
        }}
      />
      <Stack.Screen
        name="settings-consent-history"
        options={{
          sheetAllowedDetents: [0.7, 1],
          title: tSettings('privacy.consentHistory.title'),
        }}
      />
      <Stack.Screen
        name="decline-invitation"
        options={{
          sheetAllowedDetents: [0.55],
          title: tInvitations('declineReasonLabel'),
        }}
      />
    </Stack>
  );
}
