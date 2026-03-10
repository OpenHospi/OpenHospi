import { Stack, useRouter } from 'expo-router';
import { X } from 'lucide-react-native';
import { Pressable } from 'react-native';
import { useTranslation } from 'react-i18next';

export default function ModalsLayout() {
  const router = useRouter();
  const { t: tCommon } = useTranslation('translation', { keyPrefix: 'common.labels' });
  const { t: tChat } = useTranslation('translation', { keyPrefix: 'app.chat.safety_number' });
  const { t: tDiscover } = useTranslation('translation', { keyPrefix: 'app.discover' });
  const { t: tOnboarding } = useTranslation('translation', { keyPrefix: 'app.onboarding' });
  const { t: tProfile } = useTranslation('translation', { keyPrefix: 'app.profile' });

  return (
    <Stack
      screenOptions={{
        presentation: 'formSheet',
        sheetGrabberVisible: true,
        sheetCornerRadius: 16,
        headerRight: () => (
          <Pressable onPress={() => router.back()} hitSlop={8}>
            <X size={22} className="text-muted-foreground" />
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
        name="verify-identity"
        options={{
          sheetAllowedDetents: [0.85, 1],
          title: tChat('title'),
        }}
      />
    </Stack>
  );
}
