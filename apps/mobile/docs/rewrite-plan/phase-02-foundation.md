# Phase 2: Foundation & Design System

> Build the component library and utilities that all subsequent phases depend on.

## Summary

Create animation presets, haptic helpers, MMKV storage, biometric utilities. Build new UI primitives (bottom sheet, animated pressable, empty states). Rewrite all shared components with Airbnb/WhatsApp quality animations and interactions.

---

## 0A. New Utility Files

### `src/lib/animations.ts`

Spring configs and timing presets for consistent animations across the app.

```typescript
import { withSpring, withTiming, FadeIn, SlideInRight } from 'react-native-reanimated';

// Spring configs
export const SPRING_SNAPPY = { damping: 20, stiffness: 300 };
export const SPRING_GENTLE = { damping: 15, stiffness: 150 };
export const SPRING_BOUNCY = { damping: 10, stiffness: 200 };

// Timing configs
export const TIMING_FAST = { duration: 200 };
export const TIMING_MEDIUM = { duration: 350 };

// Reusable entering/exiting animations for list items
export const LIST_ITEM_ENTERING = FadeIn.duration(200);
export const SLIDE_IN = SlideInRight.springify().damping(20).stiffness(300);
```

### `src/lib/haptics.ts`

Thin wrappers around `expo-haptics` for consistent haptic feedback.

```typescript
import * as Haptics from 'expo-haptics';

export const hapticLight = () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
export const hapticMedium = () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
export const hapticHeavy = () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
export const hapticSelection = () => Haptics.selectionAsync();
export const hapticSuccess = () =>
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
export const hapticError = () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
```

### `src/lib/mmkv.ts`

Single MMKV instance for synchronous KV storage.

```typescript
import { MMKV } from 'react-native-mmkv';

export const storage = new MMKV();

// Typed helpers
export const mmkv = {
  getString: (key: string) => storage.getString(key),
  setString: (key: string, value: string) => storage.set(key, value),
  getBoolean: (key: string) => storage.getBoolean(key),
  setBoolean: (key: string, value: boolean) => storage.set(key, value),
  getNumber: (key: string) => storage.getNumber(key),
  setNumber: (key: string, value: number) => storage.set(key, value),
  delete: (key: string) => storage.delete(key),
};
```

Use for: filter state persistence, wizard progress, UI preferences, biometric toggle.

### `src/lib/biometric.ts`

Wrapper around `expo-local-authentication`.

```typescript
import * as LocalAuthentication from 'expo-local-authentication';
import { mmkv } from './mmkv';

const BIOMETRIC_ENABLED_KEY = 'biometric_enabled';

export async function isBiometricAvailable(): Promise<boolean> {
  const hasHardware = await LocalAuthentication.hasHardwareAsync();
  const isEnrolled = await LocalAuthentication.isEnrolledAsync();
  return hasHardware && isEnrolled;
}

export function isBiometricEnabled(): boolean {
  return mmkv.getBoolean(BIOMETRIC_ENABLED_KEY) ?? false;
}

export function setBiometricEnabled(enabled: boolean): void {
  mmkv.setBoolean(BIOMETRIC_ENABLED_KEY, enabled);
}

export async function authenticateWithBiometric(): Promise<boolean> {
  const result = await LocalAuthentication.authenticateAsync({
    promptMessage: 'Unlock OpenHospi',
    cancelLabel: 'Cancel',
    disableDeviceFallback: false,
  });
  return result.success;
}
```

---

## 0B. New UI Primitives (`src/components/ui/`)

### `bottom-sheet.tsx`

Wrapper around `@gorhom/bottom-sheet` with app theming.

- Export `AppBottomSheet` (standard) and `AppBottomSheetModal` (modal overlay)
- Pre-configured with app colors, backdrop, handle indicator
- Keyboard-aware by default
- Accept snap points as prop

### `animated-pressable.tsx`

Pressable with scale-down animation + haptic feedback on press.

- Uses Reanimated `useAnimatedStyle` for scale transform
- Haptic feedback via `hapticLight()` on press-in
- Accepts `disabled` prop (no animation/haptic when disabled)
- Forwards all `Pressable` props

### `pull-to-refresh.tsx`

Custom `RefreshControl` wrapper with brand animation.

- Brand color spinner
- Configurable refresh handler
- Works with FlashList and FlatList

### `empty-state.tsx`

Reusable empty state for screens with no data.

- Props: `icon` (Lucide icon), `title`, `subtitle`, `actionLabel`, `onAction`
- Centered layout with subtle fade-in animation
- Used across: empty rooms list, no applications, no conversations, etc.

### `screen-header.tsx`

Standardized screen header component.

- Back button (optional), title, right actions (optional)
- Consistent padding and typography
- Animated title on scroll (optional, for parallax headers)

---

## 0C. Enhance Existing UI Primitives

| File           | Enhancement                                                                                                                                            |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `button.tsx`   | Add `hapticLight()` on press. Add `loading` prop with `ActivityIndicator` spinner.                                                                     |
| `input.tsx`    | Add animated focus ring (Reanimated border color transition). Add red border error state.                                                              |
| `badge.tsx`    | Add animated count transition (spring animation when count changes).                                                                                   |
| `skeleton.tsx` | Add screen-specific skeleton variants: `SkeletonRoomCard`, `SkeletonConversation`, `SkeletonProfile`, `SkeletonRoomDetail`, `SkeletonApplicationCard`. |

---

## 0D. New Shared Components (`src/components/`)

| Component                | Purpose                                                                                                                    |
| ------------------------ | -------------------------------------------------------------------------------------------------------------------------- |
| `cached-image.tsx`       | `expo-image` wrapper: `cachePolicy: 'disk'`, `recyclingKey` for FlashList, `transition: 200`, muted background placeholder |
| `room-map-card.tsx`      | Compact room card shown when tapping a map pin (photo + price + city)                                                      |
| `filter-chip.tsx`        | Active filter indicator pill with X button to remove                                                                       |
| `step-indicator.tsx`     | Horizontal step progress dots for wizards (onboarding, room creation)                                                      |
| `swipeable-row.tsx`      | Generic swipeable list row using `react-native-gesture-handler` PanGesture. Reveals action buttons (archive, delete).      |
| `notification-badge.tsx` | Animated count badge (red circle with number). Spring animation on count change. Used on tab bar icons.                    |
| `share-room-sheet.tsx`   | Bottom sheet with native share via `expo-sharing`. Generates share URL.                                                    |
| `biometric-prompt.tsx`   | Face ID / fingerprint prompt component for app unlock flow.                                                                |

---

## 0E. Rewrite Shared Components

Every existing component gets a visual and interaction overhaul.

### High-priority rewrites

| Component                    | Changes                                                                                                                                                                                        |
| ---------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `room-card.tsx`              | New design with `CachedImage`, Reanimated entering animation (`FadeIn`), haptic on press, shared element ID on photo for transition to detail                                                  |
| `message-bubble.tsx`         | Reanimated layout animation for new messages (slide up + fade). Delivery status icons: clock (sending), single check (sent), double check (delivered). Long-press context menu (copy, delete). |
| `conversation-list-item.tsx` | Swipe-to-archive gesture (`swipeable-row.tsx`). Avatar with E2EE lock icon overlay. Last message preview truncated. Relative timestamps. Animated unread badge.                                |
| `my-room-card.tsx`           | Status badge with color coding (green=published, yellow=draft, gray=closed). Action menu on long-press.                                                                                        |
| `room-location-map.tsx`      | **Full rewrite** from Leaflet WebView to `expo-maps`. Use `AppleMaps.View` on iOS, `GoogleMaps.View` on Android. Show privacy circle (`circles` prop with 300m radius).                        |
| `photo-carousel.tsx`         | Pinch-to-zoom (gesture handler), page indicator dots, shared element transition support for the cover photo.                                                                                   |
| `chat-input-bar.tsx`         | Attachment button stub (for future file sharing). Reanimated keyboard animation (smooth input bar movement). Send button with haptic.                                                          |

### Standard rewrites

| Component                   | Changes                                                                                                            |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| `connection-status-bar.tsx` | Animate in/out with Reanimated (slide down from top). Color-coded: red=offline, yellow=reconnecting, green=online. |
| `profile-section-card.tsx`  | Animated expand/collapse with Reanimated layout animation.                                                         |
| `profile-field-row.tsx`     | Right chevron icon, press animation (scale down), navigation on tap.                                               |
| `chip-picker.tsx`           | Visual refresh with animated selection state.                                                                      |
| `multi-chip-picker.tsx`     | Visual refresh, haptic on selection toggle.                                                                        |
| `select-picker-sheet.tsx`   | Rewrite with `@gorhom/bottom-sheet` (replace Modal).                                                               |
| `date-picker-sheet.tsx`     | Rewrite with `@gorhom/bottom-sheet` (replace Modal).                                                               |
| `hospi-invitation-card.tsx` | Visual polish, Reanimated entering animation.                                                                      |
| `scroll-to-bottom-fab.tsx`  | Animated FAB with unread count badge, spring animation on appear/disappear.                                        |
| `date-separator.tsx`        | Visual polish for chat date separators.                                                                            |
| `encryption-gate.tsx`       | Improve loading UI (skeleton or branded spinner instead of blank).                                                 |
| `input-otp.tsx`             | Animated dots, error shake animation.                                                                              |
| `language-picker.tsx`       | Visual refresh with current language highlighted.                                                                  |
| `error-state.tsx`           | Illustration + retry button + helpful message.                                                                     |
| `offline-toast.tsx`         | Animated toast with "You're offline" message and retry action.                                                     |
| `key-change-banner.tsx`     | Warning banner with Reanimated slide-in animation.                                                                 |
| `verification-badge.tsx`    | Green check for verified, yellow warning for unverified.                                                           |

### Keep as-is

- `logo.tsx`, `logo-text.tsx` -- no changes needed

---

## 0F. Rewrite Context

### `src/context/discover-filters.tsx`

- Back state with MMKV for persistence across app restarts
- Add `activeFilterCount` computed property (for badge on filter button)
- Add `resetFilters()` method
- City filter uses free-text values from `useAvailableCities()` hook (dynamic from DB, not hardcoded enum)
- All other filters type-safe matching `DiscoverRoom` filter params

---

## Verification Checklist

After completing this phase:

- [ ] All new utility files compile: `pnpm --filter @openhospi/mobile typecheck`
- [ ] MMKV storage reads/writes work synchronously
- [ ] Haptic feedback triggers on button press (test on real device)
- [ ] `@gorhom/bottom-sheet` renders correctly with app theme
- [ ] FlashList renders room cards with `estimatedItemSize`
- [ ] `expo-maps` renders on both iOS (Apple Maps) and Android (Google Maps)
- [ ] Privacy circle renders on map with correct radius and offset
- [ ] `CachedImage` loads photos with disk caching
- [ ] All skeleton variants render correctly
- [ ] Swipeable row reveals action buttons on swipe
- [ ] Filter state persists across app restarts (MMKV)
