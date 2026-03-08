import { Stack } from 'expo-router';
import { useTranslation } from 'react-i18next';

export default function ModalsLayout() {
  const { t: tCommon } = useTranslation('translation', { keyPrefix: 'common.labels' });
  const { t: tDiscover } = useTranslation('translation', { keyPrefix: 'app.discover.filters' });
  const { t: tOnboarding } = useTranslation('translation', { keyPrefix: 'app.onboarding' });
  const { t: tProfile } = useTranslation('translation', { keyPrefix: 'app.profile' });

  return (
    <Stack>
      <Stack.Screen
        name="apply-sheet"
        options={{
          presentation: 'formSheet',
          sheetAllowedDetents: [0.6],
          sheetGrabberVisible: true,
          sheetCornerRadius: 16,
          title: tCommon('apply'),
        }}
      />
      <Stack.Screen
        name="filter-sheet"
        options={{
          presentation: 'formSheet',
          sheetAllowedDetents: [0.85, 1],
          sheetGrabberVisible: true,
          sheetCornerRadius: 16,
          title: tDiscover('title'),
        }}
      />
      <Stack.Screen
        name="edit-about"
        options={{
          presentation: 'formSheet',
          sheetAllowedDetents: [0.85, 1],
          sheetGrabberVisible: true,
          sheetCornerRadius: 16,
          title: tProfile('studyInfo'),
        }}
      />
      <Stack.Screen
        name="edit-bio"
        options={{
          presentation: 'formSheet',
          sheetAllowedDetents: [0.5],
          sheetGrabberVisible: true,
          sheetCornerRadius: 16,
          title: tOnboarding('fields.bio'),
        }}
      />
      <Stack.Screen
        name="edit-languages"
        options={{
          presentation: 'formSheet',
          sheetAllowedDetents: [0.7, 1],
          sheetGrabberVisible: true,
          sheetCornerRadius: 16,
          title: tOnboarding('steps.languages'),
        }}
      />
      <Stack.Screen
        name="edit-lifestyle"
        options={{
          presentation: 'formSheet',
          sheetAllowedDetents: [0.7, 1],
          sheetGrabberVisible: true,
          sheetCornerRadius: 16,
          title: tOnboarding('steps.personality'),
        }}
      />
      <Stack.Screen
        name="edit-photos"
        options={{
          presentation: 'formSheet',
          sheetAllowedDetents: [0.7, 1],
          sheetGrabberVisible: true,
          sheetCornerRadius: 16,
          title: tProfile('title'),
        }}
      />
    </Stack>
  );
}
