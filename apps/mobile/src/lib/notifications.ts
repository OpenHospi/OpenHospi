import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import * as Sentry from '@sentry/react-native';
import { router } from 'expo-router';
import { Platform } from 'react-native';

import { api } from './api-client';

// ── Notification Handler ────────────────────────────────────
// Configure how notifications are displayed when the app is in the foreground.

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

// ── Project ID ──────────────────────────────────────────────

function getProjectId(): string {
  const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
  if (!projectId) {
    throw new Error('EAS project ID not found in app config');
  }
  return projectId;
}

// ── Push Token Registration ─────────────────────────────────

export async function registerForPushNotifications(): Promise<string | null> {
  if (!Device.isDevice) {
    console.warn('Push notifications require a physical device');
    return null;
  }

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
    });
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    return null;
  }

  const { data: token } = await Notifications.getExpoPushTokenAsync({
    projectId: getProjectId(),
  });

  try {
    await api.post('/api/push-tokens', { expoPushToken: token });
  } catch (error) {
    Sentry.captureException(error, {
      tags: { context: 'push-token-registration' },
      level: 'warning',
    });
  }

  return token;
}

// ── Tap-to-Navigate ─────────────────────────────────────────
// When a user taps a push notification, route to the correct screen.

type NotificationData = {
  type?: string;
  conversationId?: string;
  roomId?: string;
  applicationId?: string;
  eventId?: string;
};

function handleNotificationTap(response: Notifications.NotificationResponse) {
  const data = response.notification.request.content.data as NotificationData;

  if (!data?.type) return;

  switch (data.type) {
    case 'new_message':
      if (data.conversationId) {
        router.push({
          pathname: '/(app)/(tabs)/chat/[conversationId]',
          params: { conversationId: data.conversationId },
        });
      }
      break;

    case 'new_applicant':
    case 'application_status':
      if (data.applicationId) {
        router.push({
          pathname: '/(app)/application/[id]',
          params: { id: data.applicationId },
        });
      }
      break;

    case 'event_invitation':
    case 'event_reminder':
      if (data.roomId) {
        router.push({
          pathname: '/(app)/room/[id]',
          params: { id: data.roomId },
        });
      }
      break;

    default:
      // Unknown notification type -- navigate to profile (activity section)
      router.push('/(app)/(tabs)/profile');
      break;
  }
}

// ── Badge Management ────────────────────────────────────────

export async function clearBadgeCount() {
  await Notifications.setBadgeCountAsync(0);
}

// ── Initialization ──────────────────────────────────────────
// Call once from root layout to start listening for notification taps.

let initialized = false;

export function initializeNotificationListeners() {
  if (initialized) return;
  initialized = true;

  // Handle notification taps when the app is running
  Notifications.addNotificationResponseReceivedListener(handleNotificationTap);

  // Handle the case where the app was opened by tapping a notification
  const lastResponse = Notifications.getLastNotificationResponse();
  if (lastResponse) {
    handleNotificationTap(lastResponse);
  }
}
