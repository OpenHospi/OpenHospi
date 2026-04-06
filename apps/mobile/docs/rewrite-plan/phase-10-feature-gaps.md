# Phase 10: Feature Gaps

> Close the remaining feature gaps: biometric, GDPR, share, deep links, badges, camera.

## Summary

Implement 6 features that are either missing from mobile or need mobile-native implementations.

---

## 1. Biometric Auth

**Files**: `src/lib/biometric.ts` (created in Phase 2), settings toggle (Phase 8)

### Integration points

- **App launch**: In root `_layout.tsx`, after splash screen and before showing content:
  ```typescript
  if (isBiometricEnabled() && session) {
    const authenticated = await authenticateWithBiometric();
    if (!authenticated) {
      // Show locked screen or re-prompt
    }
  }
  ```
- **Settings toggle**: In `settings.tsx`, biometric toggle triggers authentication before enabling
- **Preference storage**: MMKV key `biometric_enabled` (boolean)

---

## 2. GDPR Data Export

**Files**: New hook in `src/services/settings.ts`

### Implementation

```typescript
export function useRequestDataExport() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: ['requestDataExport'],
    mutationFn: () => api.post('/api/mobile/settings/gdpr-export'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.settings.root() });
    },
    onError: (error) => {
      // Show error toast
    },
  });
}
```

### UI (in settings screen)

- "Request my data" button
- Confirmation dialog: "We'll prepare a download of all your data. This may take up to 48 hours."
- After request: show status badge (Requested / Processing / Ready)
- When ready: download link or notification

---

## 3. Native Share

**Files**: `src/components/share-room-sheet.tsx` (created in Phase 2)

### Implementation

```typescript
import * as Sharing from 'expo-sharing';

export async function shareRoom(roomId: string, roomTitle: string) {
  const url = `https://openhospi.nl/room/${roomId}`;
  await Sharing.shareAsync(url, {
    dialogTitle: `Check out "${roomTitle}" on OpenHospi`,
  });
}
```

### Integration points

- Room detail screen: share button in bottom bar
- My room detail: share button in action menu
- Share link screen: native share option alongside QR code

---

## 4. Deep Linking

**Files**: `src/lib/notifications.ts`, `src/app/_layout.tsx`

### Notification tap routing

Extend the existing switch statement in `notifications.ts` to handle ALL notification types:

| Notification Type    | Route To                                 |
| -------------------- | ---------------------------------------- |
| `new_message`        | `/(app)/(tabs)/chat/[conversationId]`    |
| `new_applicant`      | `/(app)/(tabs)/my-rooms/[id]/applicants` |
| `application_update` | `/(app)/application/[id]`                |
| `event_invitation`   | `/(app)/application/[id]`                |
| `event_reminder`     | `/(app)/application/[id]`                |
| `room_update`        | `/(app)/room/[id]`                       |
| Default              | `/(app)/(tabs)/profile`                  |

### URL deep links

In root `_layout.tsx`, handle `expo-linking` URL events:

```typescript
import * as Linking from 'expo-linking';

useEffect(() => {
  const subscription = Linking.addEventListener('url', ({ url }) => {
    const parsed = Linking.parse(url);
    // Route based on parsed path
  });
  return () => subscription.remove();
}, []);
```

### Verify `app.config.ts` configuration

Ensure these are set:

- `scheme: 'openhospi'`
- `ios.associatedDomains: ['applinks:openhospi.nl']`
- `android.intentFilters` for `https://openhospi.nl/room/*` and `https://openhospi.nl/join/*`

---

## 5. App Badge Count

**Files**: `src/lib/notifications.ts`

### Implementation

Sync badge count with unread notification count:

```typescript
import * as Notifications from 'expo-notifications';

// When unread count changes (in notification query onSuccess):
Notifications.setBadgeCountAsync(unreadCount);

// On app open (in root layout):
Notifications.setBadgeCountAsync(0);
```

### Integration

- Update badge in `useNotifications()` query `onSuccess` callback
- Clear badge in `src/app/_layout.tsx` when app becomes active

---

## 6. Camera Integration

**Files**: Photo upload flows in onboarding, profile edit, room creation

### Implementation

Replace direct `expo-image-picker` calls with a choice action sheet:

```typescript
import * as ImagePicker from 'expo-image-picker';

function showPhotoOptions() {
  // Bottom sheet with two options:
  // 1. "Take Photo" -> ImagePicker.launchCameraAsync()
  // 2. "Choose from Library" -> ImagePicker.launchImageLibraryAsync()
}
```

### Integration points

- `edit-photos.tsx` (profile photos)
- `photos-step.tsx` (onboarding)
- `photos.tsx` (room creation wizard)
- All use existing `expo-camera` + `expo-image-picker` (already installed)

---

## Verification Checklist

- [ ] Biometric prompt appears on app launch (when enabled)
- [ ] Biometric toggle in settings works (prompts before enabling)
- [ ] GDPR data export request submits successfully
- [ ] Native share sheet opens with room URL
- [ ] Tapping notification navigates to correct screen
- [ ] URL deep link `openhospi://chat/123` works
- [ ] Universal link `https://openhospi.nl/room/abc` works
- [ ] App badge count updates with unread notifications
- [ ] Badge clears on app open
- [ ] "Take Photo" option opens camera
- [ ] "Choose from Library" option opens photo picker
