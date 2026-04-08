# Phase 10: Feature Gaps

> Close the remaining feature gaps: biometric, GDPR, share, badges, camera. (Deep linking moved to Phase 3.)

## Summary

Implement 5 features that are either missing from mobile or need mobile-native implementations. (Deep linking moved to Phase 3 -- it's foundational, notifications depend on it.)

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
  const { showToast } = useToast();
  const onError = createMutationErrorHandler(showToast);

  return useMutation({
    mutationKey: ['requestDataExport'],
    mutationFn: () => api.post('/api/mobile/settings/gdpr-export'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.settings.root() });
    },
    onError,
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

## 4. Biometric Lock Screen

> Deep linking moved to Phase 3 (foundational, notifications depend on it).

When biometric auth is enabled and the app launches (or returns from background after timeout):

### Lock screen UI

- Branded lock screen: OpenHospi logo centered, blurred background (or solid brand color)
- "Unlock with Face ID" / "Unlock with Fingerprint" text
- Biometric prompt triggers automatically on mount
- "Use InAcademia login instead" fallback link at bottom
- If biometric fails 3 times: auto-switch to InAcademia login flow

### Implementation

In root `_layout.tsx`, add a lock screen overlay:

```typescript
const [isLocked, setIsLocked] = useState(false);

// On app launch or resume from background:
if (isBiometricEnabled() && session) {
  setIsLocked(true);
  const success = await authenticateWithBiometric();
  if (success) setIsLocked(false);
}

// Render lock screen overlay when locked:
{isLocked && <BiometricLockScreen onFallback={navigateToLogin} />}
```

The lock screen renders OVER the app content (not instead of it), so the app state is preserved underneath.

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

- [ ] Biometric lock screen shows on app launch (when enabled)
- [ ] Lock screen shows branded UI (not app content visible behind)
- [ ] Biometric success dismisses lock screen
- [ ] 3 biometric failures -> falls back to InAcademia login
- [ ] Biometric toggle in settings works (prompts before enabling)
- [ ] GDPR data export request submits successfully
- [ ] Native share sheet opens with room URL
- [ ] App badge count updates with unread notifications
- [ ] Badge clears on app open
- [ ] "Take Photo" option opens camera
- [ ] "Choose from Library" option opens photo picker
- [ ] Deep links verified in Phase 3 (not this phase)
