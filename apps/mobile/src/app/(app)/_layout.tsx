import { Stack } from 'expo-router';
import { Platform } from 'react-native';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { ConnectionStatusBar } from '@/components/feedback/connection-status-bar';
import { DiscoverFiltersProvider } from '@/context/discover-filters';

const subScreenOptions = {
  animation: 'slide_from_right' as const,
  ...(Platform.OS === 'ios'
    ? { headerTransparent: true, headerBlurEffect: 'regular' as const }
    : {}),
};

export default function AppLayout() {
  const { t } = useTranslation('translation', { keyPrefix: 'app.applications' });
  const { t: tBreadcrumbs } = useTranslation('translation', { keyPrefix: 'breadcrumbs' });
  const { t: tSettings } = useTranslation('translation', { keyPrefix: 'app.settings' });
  const { t: tRooms } = useTranslation('translation', { keyPrefix: 'app.rooms' });

  return (
    <DiscoverFiltersProvider>
      <View style={{ flex: 1 }}>
        <ConnectionStatusBar />
        <Stack>
          <Stack.Screen
            name="(tabs)"
            options={{ headerShown: false, title: tBreadcrumbs('discover') }}
          />
          <Stack.Screen name="(modals)" options={{ headerShown: false }} />
          <Stack.Screen name="room/[id]" options={{ title: '', ...subScreenOptions }} />
          <Stack.Screen
            name="application/[id]"
            options={{ title: t('detailTitle'), ...subScreenOptions }}
          />
          <Stack.Screen
            name="settings"
            options={{ title: tSettings('title'), ...subScreenOptions }}
          />
          <Stack.Screen name="my-house" options={{ ...subScreenOptions }} />
          <Stack.Screen name="join/[code]" options={{ ...subScreenOptions }} />

          {/* My Rooms — create wizard */}
          <Stack.Screen
            name="manage-room/create/house-gate"
            options={{
              title: tRooms('createNew'),
              headerBackTitle: tRooms('title'),
              ...subScreenOptions,
            }}
          />
          <Stack.Screen
            name="manage-room/create/basic-info"
            options={{ title: tRooms('wizard.steps.basicInfo'), ...subScreenOptions }}
          />
          <Stack.Screen
            name="manage-room/create/details"
            options={{ title: tRooms('wizard.steps.details'), ...subScreenOptions }}
          />
          <Stack.Screen
            name="manage-room/create/preferences"
            options={{ title: tRooms('wizard.steps.preferences'), ...subScreenOptions }}
          />
          <Stack.Screen
            name="manage-room/create/photos"
            options={{ title: tRooms('wizard.steps.photos'), ...subScreenOptions }}
          />
          <Stack.Screen
            name="manage-room/create/review"
            options={{ title: tRooms('actions.publish'), ...subScreenOptions }}
          />

          {/* My Rooms — room detail & management */}
          <Stack.Screen
            name="manage-room/[id]/index"
            options={{
              title: tRooms('manage.details'),
              headerBackTitle: tRooms('title'),
              ...subScreenOptions,
            }}
          />
          <Stack.Screen
            name="manage-room/[id]/edit"
            options={{ title: tRooms('actions.edit'), ...subScreenOptions }}
          />
          <Stack.Screen
            name="manage-room/[id]/share-link"
            options={{ title: tRooms('shareLink.title'), ...subScreenOptions }}
          />
          <Stack.Screen
            name="manage-room/[id]/applicants"
            options={{ title: tRooms('applicants.title'), ...subScreenOptions }}
          />
          <Stack.Screen
            name="manage-room/[id]/applicant/[applicantUserId]"
            options={{ title: tRooms('applicants.viewProfile'), ...subScreenOptions }}
          />
          <Stack.Screen
            name="manage-room/[id]/events/index"
            options={{ title: tRooms('events.title'), ...subScreenOptions }}
          />
          <Stack.Screen
            name="manage-room/[id]/events/create"
            options={{ title: tRooms('events.createTitle'), ...subScreenOptions }}
          />
          <Stack.Screen
            name="manage-room/[id]/events/[eventId]"
            options={{ title: tRooms('events.detailTitle'), ...subScreenOptions }}
          />
          <Stack.Screen
            name="manage-room/[id]/events/invite"
            options={{ title: tRooms('invite.inviteApplicants'), ...subScreenOptions }}
          />
          <Stack.Screen
            name="manage-room/[id]/voting"
            options={{ title: tRooms('voting.title'), ...subScreenOptions }}
          />
          <Stack.Screen
            name="manage-room/[id]/close-room"
            options={{ title: tRooms('closeRoom.title'), ...subScreenOptions }}
          />
        </Stack>
      </View>
    </DiscoverFiltersProvider>
  );
}
