import Stack from 'expo-router/stack';
import { Platform } from 'react-native';
import { useTranslation } from 'react-i18next';

export default function MyRoomsLayout() {
  const { t } = useTranslation('translation', { keyPrefix: 'app.rooms' });

  return (
    <Stack
      screenOptions={{
        headerLargeTitle: true,
        ...(Platform.OS === 'ios'
          ? { headerTransparent: true, headerBlurEffect: 'regular' }
          : undefined),
      }}>
      <Stack.Screen name="index" options={{ title: t('title') }} />
      <Stack.Screen
        name="create/house-gate"
        options={{ title: t('createNew'), headerLargeTitle: false }}
      />
      <Stack.Screen
        name="create/basic-info"
        options={{ title: t('wizard.steps.basicInfo'), headerLargeTitle: false }}
      />
      <Stack.Screen
        name="create/details"
        options={{ title: t('wizard.steps.details'), headerLargeTitle: false }}
      />
      <Stack.Screen
        name="create/preferences"
        options={{ title: t('wizard.steps.preferences'), headerLargeTitle: false }}
      />
      <Stack.Screen
        name="create/photos"
        options={{ title: t('wizard.steps.photos'), headerLargeTitle: false }}
      />
      <Stack.Screen
        name="create/review"
        options={{ title: t('actions.publish'), headerLargeTitle: false }}
      />
      <Stack.Screen
        name="[id]/index"
        options={{ title: t('manage.details'), headerLargeTitle: false }}
      />
      <Stack.Screen
        name="[id]/edit"
        options={{ title: t('actions.edit'), headerLargeTitle: false }}
      />
      <Stack.Screen
        name="[id]/share-link"
        options={{ title: t('shareLink.title'), headerLargeTitle: false }}
      />
      <Stack.Screen
        name="[id]/applicants"
        options={{ title: t('applicants.title'), headerLargeTitle: false }}
      />
      <Stack.Screen
        name="[id]/applicant/[applicantUserId]"
        options={{ title: t('applicants.viewProfile'), headerLargeTitle: false }}
      />
      <Stack.Screen
        name="[id]/events/index"
        options={{ title: t('events.title'), headerLargeTitle: false }}
      />
      <Stack.Screen
        name="[id]/events/create"
        options={{ title: t('events.createTitle'), headerLargeTitle: false }}
      />
      <Stack.Screen
        name="[id]/events/[eventId]"
        options={{ title: t('events.detailTitle'), headerLargeTitle: false }}
      />
      <Stack.Screen
        name="[id]/events/invite"
        options={{ title: t('invite.inviteApplicants'), headerLargeTitle: false }}
      />
      <Stack.Screen
        name="[id]/voting"
        options={{ title: t('voting.title'), headerLargeTitle: false }}
      />
      <Stack.Screen
        name="[id]/close-room"
        options={{ title: t('closeRoom.title'), headerLargeTitle: false }}
      />
    </Stack>
  );
}
