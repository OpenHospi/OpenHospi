import Stack from 'expo-router/stack';
import { Platform } from 'react-native';
import { useTranslation } from 'react-i18next';

export default function MyRoomsLayout() {
  const { t } = useTranslation('translation', { keyPrefix: 'app.rooms' });

  return (
    <Stack
      screenOptions={{
        headerLargeTitle: false,
        animation: 'slide_from_right',
        ...(Platform.OS === 'ios'
          ? { headerTransparent: true, headerBlurEffect: 'regular' }
          : undefined),
      }}>
      <Stack.Screen name="create/house-gate" options={{ title: t('createNew') }} />
      <Stack.Screen name="create/basic-info" options={{ title: t('wizard.steps.basicInfo') }} />
      <Stack.Screen name="create/details" options={{ title: t('wizard.steps.details') }} />
      <Stack.Screen name="create/preferences" options={{ title: t('wizard.steps.preferences') }} />
      <Stack.Screen name="create/photos" options={{ title: t('wizard.steps.photos') }} />
      <Stack.Screen name="create/review" options={{ title: t('actions.publish') }} />
      <Stack.Screen name="[id]/index" options={{ title: t('manage.details') }} />
      <Stack.Screen name="[id]/edit" options={{ title: t('actions.edit') }} />
      <Stack.Screen name="[id]/share-link" options={{ title: t('shareLink.title') }} />
      <Stack.Screen name="[id]/applicants" options={{ title: t('applicants.title') }} />
      <Stack.Screen
        name="[id]/applicant/[applicantUserId]"
        options={{ title: t('applicants.viewProfile') }}
      />
      <Stack.Screen name="[id]/events/index" options={{ title: t('events.title') }} />
      <Stack.Screen name="[id]/events/create" options={{ title: t('events.createTitle') }} />
      <Stack.Screen name="[id]/events/[eventId]" options={{ title: t('events.detailTitle') }} />
      <Stack.Screen name="[id]/events/invite" options={{ title: t('invite.inviteApplicants') }} />
      <Stack.Screen name="[id]/voting" options={{ title: t('voting.title') }} />
      <Stack.Screen name="[id]/close-room" options={{ title: t('closeRoom.title') }} />
    </Stack>
  );
}
