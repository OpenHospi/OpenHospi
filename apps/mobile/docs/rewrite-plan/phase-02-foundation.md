# Phase 2: Foundation & Design System

> Build the component library, utilities, and toast system that all subsequent phases depend on.

## Summary

Install new native dependencies. Create animation presets, haptic helpers, MMKV storage, biometric utilities. Build a
toast feedback system. Create new UI primitives (bottom sheet via @gorhom, animated pressable, empty state). Rewrite
every shared component from scratch with Airbnb/WhatsApp quality animations and interactions. Add `onError` callbacks to
all 48 mutations across 11 service files.

---

## Dependencies

### Install

```bash
pnpm --filter @openhospi/mobile add @gorhom/bottom-sheet@5 @shopify/flash-list react-native-mmkv expo-local-authentication expo-maps
pnpm dev:mobile:prebuild
```

### Remove

After expo-maps integration:

- `react-native-leaflet-view` from `package.json`
- `patches/react-native-leaflet-view@1.1.2.patch`
- `apps/mobile/assets/leaflet.html`
- Leaflet exclusion from expo-doctor config in `app.config.ts` (if any)
- `patchedDependencies` entry in root `package.json`

---

## 0A. New Utility Files

### `src/lib/animations.ts`

Spring configs and timing presets for consistent animations across the app.

```typescript
import { FadeIn, SlideInRight, withSpring, withTiming } from 'react-native-reanimated';

export const SPRING_SNAPPY = { damping: 20, stiffness: 300 };
export const SPRING_GENTLE = { damping: 15, stiffness: 150 };
export const SPRING_BOUNCY = { damping: 10, stiffness: 200 };

export const TIMING_FAST = { duration: 200 };
export const TIMING_MEDIUM = { duration: 350 };

export const LIST_ITEM_ENTERING = FadeIn.duration(200);
export const SLIDE_IN = SlideInRight.springify().damping(20).stiffness(300);
```

### `src/lib/haptics.ts`

Named exports for consistent haptic feedback throughout the app.

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

export const mmkv = {
  getString: (key: string) => storage.getString(key),
  setString: (key: string, value: string) => storage.set(key, value),
  getBoolean: (key: string) => storage.getBoolean(key),
  setBoolean: (key: string, value: boolean) => storage.set(key, value),
  getNumber: (key: string) => storage.getNumber(key),
  setNumber: (key: string, value: number) => storage.set(key, value),
  getObject: <T>(key: string): T | undefined => {
    const str = storage.getString(key);
    return str ? (JSON.parse(str) as T) : undefined;
  },
  setObject: (key: string, value: unknown) => storage.set(key, JSON.stringify(value)),
  delete: (key: string) => storage.delete(key),
};
```

Use for: filter state persistence, wizard progress, UI preferences, biometric toggle.

### `src/lib/biometric.ts`

Biometric authentication utilities using `expo-local-authentication`.

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

## 0B. Toast / Error Feedback System

> Prerequisite for mutation `onError` callbacks (Section 0I). Must be built first.

### `src/context/toast.tsx`

Toast context provider with queue, auto-dismiss, and haptic feedback.

- State: `toasts: { id: string; type: 'success' | 'error' | 'info'; message: string }[]`
- `showToast(type, message, duration?)` adds to queue with unique ID
- Auto-dismiss: 3s for success/info, 5s for errors
- Haptic feedback: `hapticSuccess()` for success, `hapticError()` for error, none for info
- Renders `<ToastContainer />` at bottom of screen (above tab bar, `bottom: 100`)

```typescript
type Toast = { id: string; type: 'success' | 'error' | 'info'; message: string };

type ToastContextValue = { showToast: (type: Toast['type'], message: string) => void };

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  function showToast(type: Toast['type'], message: string) {
    const id = crypto.randomUUID();
    setToasts((prev) => [...prev, { id, type, message }]);

    if (type === 'success') hapticSuccess();
    if (type === 'error') hapticError();

    const duration = type === 'error' ? 5000 : 3000;
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, duration);
  }

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <ToastContainer toasts={toasts} />
    </ToastContext.Provider>
  );
}
```

### `src/components/toast.tsx`

Toast UI component. Each toast is an animated pill at the bottom of the screen.

- Color-coded: `bg-destructive` for error, `bg-primary` for success, `bg-foreground` for info
- Icons: `AlertCircle` (error), `CheckCircle2` (success), `Info` (info) from lucide-react-native
- Text: matching foreground color per type
- Reanimated `FadeIn.duration(200)` entering, `FadeOut.duration(200)` exiting
- Absolute position: bottom 100, left/right 24, borderRadius 12, zIndex 999

### `src/hooks/use-toast.ts`

```typescript
import { useContext } from 'react';
import { ToastContext } from '@/context/toast';

export function useToast() {
  return useContext(ToastContext);
}
```

### `src/app/_layout.tsx` -- MODIFY

Add `ToastProvider` and `BottomSheetModalProvider` to the provider tree:

```
Current:  PersistQueryClientProvider > I18nextProvider > ThemeProvider > SessionProvider > RootNavigator
New:      PersistQueryClientProvider > I18nextProvider > ThemeProvider > BottomSheetModalProvider > SessionProvider > ToastProvider > RootNavigator
```

`BottomSheetModalProvider` from `@gorhom/bottom-sheet` enables modal bottom sheets throughout the app.
`ToastProvider` renders toasts above all content.

### i18n keys

Add to `packages/i18n/messages/{nl,en,de}/shared.json` under `common.errors`:

| Key            | EN                                       | NL                                            | DE                                                  |
| -------------- | ---------------------------------------- | --------------------------------------------- | --------------------------------------------------- |
| `generic`      | Something went wrong. Please try again.  | Er is iets misgegaan. Probeer het opnieuw.    | Etwas ist schiefgelaufen. Bitte erneut versuchen.   |
| `network`      | No internet connection.                  | Geen internetverbinding.                      | Keine Internetverbindung.                           |
| `timeout`      | The request timed out. Please try again. | Het verzoek is verlopen. Probeer het opnieuw. | Zeituberschreitung. Bitte erneut versuchen.         |
| `uploadFailed` | Photo upload failed. Please try again.   | Foto uploaden mislukt. Probeer het opnieuw.   | Foto-Upload fehlgeschlagen. Bitte erneut versuchen. |
| `sendFailed`   | Message could not be sent.               | Bericht kon niet worden verzonden.            | Nachricht konnte nicht gesendet werden.             |

### Delete

`src/components/offline-toast.tsx` -- replaced entirely by the toast system. Network loss toasts handled by
`network.ts` calling `showToast()` directly.

---

## 0C. New UI Primitives (`src/components/ui/`)

### `bottom-sheet.tsx` -- FULL REWRITE

Delete `src/components/bottom-sheet.tsx` (the old Modal-based, `forwardRef` implementation). This is a brand-new
component built on `@gorhom/bottom-sheet`.

Exports:

- `AppBottomSheet` -- standard bottom sheet with snap points
- `AppBottomSheetModal` -- modal variant with backdrop

Implementation:

- Pre-configured backdrop: `BottomSheetBackdrop` with `disappearsOnIndex={-1}`, `appearsOnIndex={0}`
- Background: `bg-background` via `backgroundStyle`
- Handle indicator: themed with `NAV_THEME[theme].colors.border`
- Keyboard-aware: `keyboardBehavior="interactive"` + `keyboardBlurBehavior="restore"`
- Props: `snapPoints`, `children`, `title?`, `footer?`, `onDismiss?`
- Title header with close X button
- No `forwardRef` -- uses `ref` as regular prop (React 19)

### `animated-pressable.tsx`

Pressable with scale-down animation + haptic feedback on press.

```typescript
import { Pressable } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { SPRING_SNAPPY } from '@/lib/animations';
import { hapticLight } from '@/lib/haptics';

type AnimatedPressableProps = React.ComponentProps<typeof Pressable> & {
  scaleValue?: number;
};

export function AnimatedPressable({
  scaleValue = 0.97,
  disabled,
  onPressIn,
  onPressOut,
  ...props
}: AnimatedPressableProps) {
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  function handlePressIn(e: any) {
    if (!disabled) {
      scale.value = withSpring(scaleValue, SPRING_SNAPPY);
      hapticLight();
    }
    onPressIn?.(e);
  }

  function handlePressOut(e: any) {
    scale.value = withSpring(1, SPRING_SNAPPY);
    onPressOut?.(e);
  }

  return (
    <Animated.View style={animatedStyle}>
      <Pressable
        disabled={disabled}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        {...props}
      />
    </Animated.View>
  );
}
```

### `empty-state.tsx`

Reusable empty state for screens with no data.

- Props: `icon` (LucideIcon), `title: string`, `subtitle?: string`, `actionLabel?: string`, `onAction?: () => void`
- Centered layout with `FadeIn.duration(300)` entering animation
- Uses existing `Text` and `Button` components
- Icon 48px with `text-muted-foreground`, title `text-lg font-semibold`, subtitle `text-sm text-muted-foreground`
- Used across: empty rooms list, no applications, no conversations, etc.

### `screen-header.tsx`

Standardized screen header component.

- Props: `title: string`, `onBack?: () => void`, `rightAction?: ReactNode`
- `flexDirection: 'row'`, `alignItems: 'center'`, `paddingHorizontal: 16`, `height: 56`
- Back button: `ChevronLeft` icon in ghost Button, visible when `onBack` provided
- Title: `text-lg font-semibold text-foreground`, `flex: 1`
- Right action: arbitrary ReactNode slot

**No `pull-to-refresh.tsx`** -- use `RefreshControl` directly with `tintColor={BRAND_COLOR}` and
`colors={[BRAND_COLOR]}` inline wherever needed.

**No `cached-image.tsx`** -- use `expo-image` `Image` directly with `cachePolicy="disk"`, `transition={200}`, and
`recyclingKey` for FlashList. No wrapper needed.

---

## 0D. Enhance Existing UI Primitives

### `button.tsx` -- REWRITE

Current: Pure `Pressable` with CVA variants, no haptics, no loading state.

Add to the existing component:

1. `loading?: boolean` prop -- renders `ActivityIndicator` instead of children, disables press
2. `onPressIn` handler calling `hapticLight()` from `@/lib/haptics`
3. `ActivityIndicator` uses `accent-` prefix for color matching variant

```typescript
type ButtonProps = React.ComponentProps<typeof Pressable> &
  VariantProps<typeof buttonVariants> & {
    loading?: boolean;
  };

function Button({ className, variant, size, loading, onPressIn, ...props }: ButtonProps) {
  function handlePressIn(e: any) {
    if (!loading && !props.disabled) hapticLight();
    onPressIn?.(e);
  }

  return (
    <TextClassContext.Provider value={buttonTextVariants({ variant, size })}>
      <Pressable
        className={cn(
          (props.disabled || loading) && 'opacity-50',
          buttonVariants({ variant, size }),
          className
        )}
        role="button"
        disabled={props.disabled || loading}
        onPressIn={handlePressIn}
        {...props}>
        {loading ? (
          <ActivityIndicator size="small" className="accent-primary-foreground" />
        ) : (
          props.children
        )}
      </Pressable>
    </TextClassContext.Provider>
  );
}
```

### `input.tsx` -- REWRITE

Current: Static border, no native focus animation, no error state.

Full rewrite with:

1. `error?: boolean` prop -- applies `border-destructive` color
2. `Animated.View` border with `interpolateColor` transition on focus
3. On focus: animated border from `border-input` to `border-ring`
4. When `error`: destructive border, overrides focus color

```typescript
function Input({ className, error, onFocus, onBlur, ...props }: InputProps) {
  const focused = useSharedValue(0);

  const animatedBorderStyle = useAnimatedStyle(() => ({
    borderColor: error
      ? '#ef4444'
      : interpolateColor(focused.value, [0, 1], ['#e5e7eb', '#0d9488']),
  }));

  return (
    <Animated.View style={[{ borderWidth: 1, borderRadius: 8 }, animatedBorderStyle]}>
      <TextInput
        onFocus={(e) => {
          focused.value = withTiming(1, TIMING_FAST);
          onFocus?.(e);
        }}
        onBlur={(e) => {
          focused.value = withTiming(0, TIMING_FAST);
          onBlur?.(e);
        }}
        className={cn(
          'dark:bg-input/30 bg-background text-foreground flex h-10 w-full min-w-0 flex-row items-center rounded-md px-3 py-1 text-base leading-5 shadow-sm shadow-black/5 sm:h-9',
          className
        )}
        {...props}
      />
    </Animated.View>
  );
}
```

### `badge.tsx` -- REWRITE

Current: Static badge with CVA variants, no animation.

Full rewrite adding spring bounce on content change:

```typescript
function Badge({ className, variant, asChild, children, ...props }: BadgeProps) {
  const scale = useSharedValue(1);
  const Component = asChild ? Slot.View : View;

  useEffect(() => {
    scale.value = withSequence(withSpring(1.15, SPRING_SNAPPY), withSpring(1, SPRING_SNAPPY));
  }, [children, scale]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <TextClassContext.Provider value={badgeTextVariants({ variant })}>
      <Animated.View style={animatedStyle}>
        <Component className={cn(badgeVariants({ variant }), className)} {...props}>
          {children}
        </Component>
      </Animated.View>
    </TextClassContext.Provider>
  );
}
```

### `src/components/skeleton.tsx` -- ADD VARIANTS

Current: Has `SkeletonLine`, `SkeletonCircle`, `SkeletonCard`, `SkeletonList`.

Add screen-specific skeleton variants composing existing primitives:

| Variant                   | Layout                                                                                  |
| ------------------------- | --------------------------------------------------------------------------------------- |
| `SkeletonRoomCard`        | 4:3 aspect ratio image placeholder + 3 text lines + price row. Matches `room-card.tsx`. |
| `SkeletonConversation`    | Avatar circle (48px) + 2 text lines. Matches `conversation-list-item.tsx`.              |
| `SkeletonProfile`         | Large circle (80px) + 4 field rows (label + value). Matches profile screen.             |
| `SkeletonRoomDetail`      | Full-width image (SCREEN_WIDTH x 3/4 height) + title line + details grid.               |
| `SkeletonApplicationCard` | Card with status badge placeholder + 2 text lines. Matches application card.            |

---

## 0E. New Shared Components (`src/components/`)

### `room-map-card.tsx`

Compact room card shown when tapping a map pin.

- Props: `room: { id, title, coverPhotoUrl, city, totalCost }`, `onPress: () => void`
- Horizontal layout: small image (80x60) + title + city + price
- `AnimatedPressable` as root
- `expo-image` `Image` with `cachePolicy="disk"`, `transition={200}`

### `filter-chip.tsx`

Active filter indicator pill with X button to remove.

```typescript
type FilterChipProps = { label: string; onRemove: () => void };

export function FilterChip({ label, onRemove }: FilterChipProps) {
  return (
    <Animated.View entering={FadeIn.duration(200)} exiting={FadeOut.duration(200)}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 4,
          paddingHorizontal: 12,
          paddingVertical: 6,
          borderRadius: 999,
        }}
        className="bg-secondary">
        <Text className="text-secondary-foreground text-sm">{label}</Text>
        <AnimatedPressable onPress={onRemove}>
          <X size={14} className="text-secondary-foreground" />
        </AnimatedPressable>
      </View>
    </Animated.View>
  );
}
```

### `step-indicator.tsx`

Horizontal step progress dots for wizards (onboarding, room creation).

```typescript
type StepIndicatorProps = { totalSteps: number; currentStep: number };

export function StepIndicator({ totalSteps, currentStep }: StepIndicatorProps) {
  return (
    <View style={{ flexDirection: 'row', gap: 8, justifyContent: 'center' }}>
      {Array.from({ length: totalSteps }, (_, i) => (
        <Animated.View
          key={i}
          layout={LinearTransition.springify()}
          style={{ height: 8, borderRadius: 4, width: i === currentStep ? 24 : 8 }}
          className={
            i === currentStep ? 'bg-primary' : i < currentStep ? 'bg-primary/50' : 'bg-muted'
          }
        />
      ))}
    </View>
  );
}
```

Active dot becomes a pill (width 24), completed dots are semi-transparent primary, future dots are muted.

### `swipeable-row.tsx`

Generic swipeable list row using `react-native-gesture-handler` `Gesture.Pan`.

- `rightActions?: { icon: LucideIcon; color: string; onPress: () => void }[]`
- Swipe threshold: 80px to reveal actions
- Spring-back on release below threshold
- `Animated.View` with `translateX` shared value
- Action buttons render behind the content row

### `notification-badge.tsx`

Animated count badge (red circle with number). Spring animation on count change.

```typescript
type NotificationBadgeProps = { count: number };

export function NotificationBadge({ count }: NotificationBadgeProps) {
  const scale = useSharedValue(0);

  useEffect(() => {
    scale.value = count > 0 ? withSpring(1, SPRING_BOUNCY) : withSpring(0, SPRING_SNAPPY);
  }, [count, scale]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  if (count === 0) return null;

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          top: -4,
          right: -8,
          minWidth: 18,
          height: 18,
          borderRadius: 9,
          justifyContent: 'center',
          alignItems: 'center',
          paddingHorizontal: 4,
        },
        animatedStyle,
      ]}
      className="bg-destructive">
      <Text className="text-xs font-bold text-white">
        {count > 99 ? '99+' : String(count)}
      </Text>
    </Animated.View>
  );
}
```

### `share-room-sheet.tsx`

Bottom sheet with native share via `expo-sharing`.

- Uses `AppBottomSheetModal` from `@gorhom/bottom-sheet`
- Shows room title + generated share URL
- Calls `Sharing.shareAsync()` with deep link URL (`https://openhospi.nl/room/${id}`)

### `biometric-prompt.tsx`

Face ID / fingerprint prompt component for app unlock flow.

- Full-screen overlay with Face ID / Fingerprint icon
- SF Symbols via `expo-symbols` on iOS, `Fingerprint` from lucide-react-native on Android
- Calls `authenticateWithBiometric()` from `@/lib/biometric`
- Success callback prop, fallback "Use PIN instead" button

---

## 0F. High-Priority Component Rewrites

Every component in this section is **rewritten from scratch**. Delete the existing file, write the new implementation.

### `room-card.tsx` -- FULL REWRITE

Rewrite from scratch with:

- `expo-image` `Image` with `cachePolicy="disk"`, `transition={200}` directly
- `AnimatedPressable` as the root (scale + haptic built in)
- `Animated.View` with `entering={LIST_ITEM_ENTERING}` for list fade-in
- `sharedTransitionTag` on cover image for hero transition to room detail
- Same visual design (4:3 image + title + city/type/size + price) but rebuilt cleanly
- Uses `getStoragePublicUrl`, typed `DiscoverRoom` prop, i18n via `useTranslation`

### `message-bubble.tsx` -- FULL REWRITE

Rewrite from scratch with:

- `status` prop: `'sending' | 'sent' | 'delivered'`
- `Animated.View` root with `entering={SlideInDown.duration(200)}` for new message animation
- Delivery status icons inline after timestamp (own messages only):
  - `'sending'` --> `Clock` (12px, opacity 0.5)
  - `'sent'` --> `Check` (12px, opacity 0.7)
  - `'delivered'` --> `CheckCheck` (12px, opacity 0.7)
- Long-press context menu via `@rn-primitives/context-menu` (already installed):
  - "Copy" --> `Clipboard.setStringAsync(text)`
  - "Delete" (own messages only) --> `onDelete?` callback prop
- Same grouped bubble radius logic (16px outer, 4px inner) but cleaner implementation
- Props: `isOwn`, `text`, `senderName`, `showSender`, `isFirstInGroup`, `isLastInGroup`, `timestamp`, `status`,
  `onDelete?`

### `conversation-list-item.tsx` -- FULL REWRITE

Rewrite from scratch with:

- `SwipeableRow` as root with right action: archive button (`Archive` icon, muted bg)
- `onArchive` prop for swipe action
- `AnimatedPressable` for the row content (scale + haptic on press)
- `NotificationBadge` component for unread count (replaces inline badge View)
- `Lock` icon (10px) overlay on avatar at bottom-right for E2EE indicator
- Same data props but cleaner implementation
- `formatRelativeTime` stays as a plain function at file top

### `my-room-card.tsx` -- FULL REWRITE

Rewrite from scratch with:

- `expo-image` `Image` with `cachePolicy="disk"`, `transition={200}` directly
- `AnimatedPressable` as root
- `Animated.View` with `entering={LIST_ITEM_ENTERING}` for list fade-in
- Status badge with existing variant mapping (companion objects from `@openhospi/shared/enums`)

### `room-location-map.tsx` -- FULL REWRITE

Current: Uses `react-native-leaflet-view` WebView with custom HTML asset.
New: Uses `expo-maps` with native `AppleMaps.View` (iOS) / `GoogleMaps.View` (Android).

```typescript
import { AppleMaps, GoogleMaps } from 'expo-maps';
import { Platform, View } from 'react-native';
import {
  MAP_DEFAULT_ZOOM,
  MAP_PRIVACY_OFFSET,
  MAP_PRIVACY_RADIUS,
} from '@openhospi/shared/constants';

type Props = { latitude: number; longitude: number };

function offsetCoords(lat: number, lng: number) {
  const seed = Math.abs(Math.sin(lat * 1000 + lng * 2000));
  const offsetLat = (seed - 0.5) * MAP_PRIVACY_OFFSET;
  const offsetLng = (((seed * 1.3) % 1) - 0.5) * MAP_PRIVACY_OFFSET;
  return { latitude: lat + offsetLat, longitude: lng + offsetLng };
}

export default function RoomLocationMap({ latitude, longitude }: Props) {
  const center = offsetCoords(latitude, longitude);
  const MapView = Platform.OS === 'ios' ? AppleMaps.View : GoogleMaps.View;

  return (
    <View style={{ height: 256, borderRadius: 12, overflow: 'hidden' }}>
      <MapView
        style={{ flex: 1 }}
        cameraPosition={{ coordinates: center, zoom: MAP_DEFAULT_ZOOM }}
        uiSettings={{ scrollEnabled: false, zoomEnabled: false, rotateEnabled: false }}
        circles={[
          {
            center,
            radius: MAP_PRIVACY_RADIUS,
            fillColor: 'rgba(13, 148, 136, 0.15)',
            strokeColor: 'rgba(13, 148, 136, 0.5)',
            strokeWidth: 2,
          },
        ]}
      />
    </View>
  );
}
```

Config changes:

- Add `expo-maps` plugin to `app.config.ts`
- Google Maps API key for Android in `app.config.ts` or `.env.local`
- Remove `react-native-leaflet-view` from `package.json` + `patchedDependencies`
- Delete `assets/leaflet.html`

### `photo-carousel.tsx` -- FULL REWRITE

Rewrite from scratch with:

- `expo-image` `Image` with `cachePolicy="disk"`, `transition={200}` directly
- Pinch-to-zoom using composed gestures:

```typescript
const pinch = Gesture.Pinch()
  .onUpdate((e) => {
    scale.value = e.scale;
  })
  .onEnd(() => {
    scale.value = withSpring(1, SPRING_SNAPPY);
  });

const pan = Gesture.Pan()
  .onUpdate((e) => {
    translateX.value = e.translationX;
    translateY.value = e.translationY;
  })
  .onEnd(() => {
    translateX.value = withSpring(0);
    translateY.value = withSpring(0);
  });

const composed = Gesture.Simultaneous(pinch, pan);
```

- Each image inside `GestureDetector` with the composed gesture
- Animated page indicator dots (active dot becomes pill, like `StepIndicator`)
- `sharedTransitionTag` on first image for hero transition
- `Animated.FlatList` for gesture-aware scrolling

### `chat-input-bar.tsx` -- FULL REWRITE

Rewrite from scratch with:

- `hapticLight()` from `@/lib/haptics` (not direct `Haptics.impactAsync`)
- `Paperclip` icon button stub next to send (disabled, for future file sharing)
- `useAnimatedKeyboard()` from `react-native-reanimated` for smooth keyboard animation:
  ```typescript
  const keyboard = useAnimatedKeyboard();
  const animatedStyle = useAnimatedStyle(() => ({
    paddingBottom: 12 + keyboard.height.value,
  }));
  ```
- `AnimatedPressable` for the send button
- `Animated.View` root with the keyboard-aware style
- Same props interface but cleaner implementation

---

## 0G. Standard Component Rewrites

All components in this section are **full rewrites** -- delete the old file, write from scratch.

### Batch 1 -- Visual polish (5 files)

| Component                   | Rewrite spec                                                                                      |
| --------------------------- | ------------------------------------------------------------------------------------------------- |
| `date-separator.tsx`        | Center-aligned text between horizontal lines. `FadeIn` entering animation.                        |
| `verification-badge.tsx`    | `ShieldCheck` (green, verified) / `ShieldAlert` (yellow, unverified). Scale spring on appearance. |
| `language-picker.tsx`       | Active language highlighted (`bg-primary/10` + `border-primary`). `hapticSelection()` on change.  |
| `hospi-invitation-card.tsx` | `AnimatedPressable` root, `Animated.View` with `entering={FadeIn.duration(200)}`.                 |
| `key-change-banner.tsx`     | `Animated.View` + `entering={SlideInDown.springify()}`, `AlertTriangle` icon, yellow background.  |

### Batch 2 -- Animations + interaction (6 files)

| Component                   | Rewrite spec                                                                                   |
| --------------------------- | ---------------------------------------------------------------------------------------------- |
| `connection-status-bar.tsx` | 3-state colors: red=offline, yellow=reconnecting, green=online. Reanimated slide in/out.       |
| `profile-section-card.tsx`  | Animated expand/collapse (`useAnimatedStyle` height interpolation). Chevron rotates on expand. |
| `profile-field-row.tsx`     | `AnimatedPressable` root, `ChevronRight` icon on right, haptic on tap.                         |
| `chip-picker.tsx`           | Animated selection: selected gets `bg-primary` + scale spring, unselected fades to `bg-muted`. |
| `multi-chip-picker.tsx`     | Same animated selection, `hapticSelection()` on each toggle.                                   |
| `scroll-to-bottom-fab.tsx`  | `NotificationBadge` for unread count, spring animation on appear (scale 0 to 1).               |

### Batch 3 -- Bottom sheet consumers (2 files)

| Component                 | Rewrite spec                                                                                                  |
| ------------------------- | ------------------------------------------------------------------------------------------------------------- |
| `select-picker-sheet.tsx` | Full rewrite using `AppBottomSheetModal` (@gorhom). No forwardRef. Clean props, snap points, themed bg.       |
| `date-picker-sheet.tsx`   | Full rewrite using `AppBottomSheetModal`. `@react-native-community/datetimepicker` as content. No forwardRef. |

### Batch 4 -- Functional (3 files)

| Component             | Rewrite spec                                                                                          |
| --------------------- | ----------------------------------------------------------------------------------------------------- |
| `encryption-gate.tsx` | `SkeletonProfile` loading state, proper error state with retry. Clean PIN input flow.                 |
| `error-state.tsx`     | `AlertTriangle` icon, `FadeIn` animation, styled retry button. Props: `title`, `subtitle`, `onRetry`. |
| `input-otp.tsx`       | Animated dots (filled dot scales in with spring), error shake animation (`withSequence` translateX).  |

### Delete

`offline-toast.tsx` -- replaced entirely by the toast system (Section 0B). Network loss toasts handled by `network.ts`
calling `showToast()` directly.

### Keep as-is

- `logo.tsx`, `logo-text.tsx` -- no changes needed

---

## 0H. Rewrite Discover Filters Context

### `src/context/discover-filters.tsx` -- FULL REWRITE

Current: Basic `useState<DiscoverFilters>({})`. No persistence, no computed values. 27 lines.

Rewrite with:

1. MMKV-backed state: read `mmkv.getObject<DiscoverFilters>('discover_filters')` on init, write on every `setFilters`
2. `activeFilterCount` computed property -- counts non-empty/non-default filter keys
3. `resetFilters()` method -- clears MMKV key + resets state to `{}`
4. City filter uses free-text values (dynamic from DB, not hardcoded enum)

```typescript
type DiscoverFiltersContextValue = {
  filters: DiscoverFilters;
  setFilters: (filters: DiscoverFilters) => void;
  activeFilterCount: number;
  resetFilters: () => void;
};

export function DiscoverFiltersProvider({ children }: { children: React.ReactNode }) {
  const [filters, setFiltersState] = useState<DiscoverFilters>(
    () => mmkv.getObject<DiscoverFilters>('discover_filters') ?? {}
  );

  function setFilters(next: DiscoverFilters) {
    setFiltersState(next);
    mmkv.setObject('discover_filters', next);
  }

  function resetFilters() {
    setFiltersState({});
    mmkv.delete('discover_filters');
  }

  const activeFilterCount = Object.values(filters).filter(
    (v) =>
      v !== undefined && v !== null && v !== '' && !(Array.isArray(v) && v.length === 0)
  ).length;

  return (
    <DiscoverFiltersContext.Provider
      value={{ filters, setFilters, activeFilterCount, resetFilters }}>
      {children}
    </DiscoverFiltersContext.Provider>
  );
}
```

---

## 0I. Mutation `onError` Callbacks

### `src/lib/mutation-error.ts` -- NEW

Shared error handler factory for all mutation hooks.

```typescript
import { ApiError } from '@/lib/api-client';
import { hapticError } from '@/lib/haptics';

type ShowToastFn = (type: 'error', message: string) => void;

export function createMutationErrorHandler(showToast: ShowToastFn, fallbackMessage?: string) {
  return (error: Error) => {
    const message =
      error instanceof ApiError ? error.message : (fallbackMessage ?? 'Something went wrong');
    showToast('error', message);
    hapticError();
  };
}
```

### All 11 service files -- ADD `onError`

**Pattern for simple mutations** (no existing rollback):

```typescript
export function useCreateHouse() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const onError = createMutationErrorHandler(showToast);

  return useMutation({
    mutationFn: (name: string) => api.post<{ id: string }>('/api/mobile/my-rooms/houses', { name }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.myRooms.houses() });
    },
    onError,
  });
}
```

**Pattern for mutations WITH existing optimistic rollback** (chat.ts `useSendMessage`, rooms.ts `useApplyToRoom`):

```typescript
onError: (error, variables, context) => {
  // Existing rollback logic preserved
  if (context?.previousMessages) {
    queryClient.setQueryData(
      queryKeys.chat.messages(variables.conversationId),
      context.previousMessages
    );
  }
  // User-facing feedback added
  showToast('error', error instanceof ApiError ? error.message : t('common.errors.sendFailed'));
  hapticError();
},
```

### Complete mutation inventory (48 total)

| Service file       | Mutations (22/7/5/3/3/2/2/1/1/1/1)                                                                                                                                                                                                                                                                                                                                                                                    | Has existing onError        |
| ------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------- |
| `my-rooms.ts`      | useCreateHouse, useCreateDraft, useSaveBasicInfo, useSaveDetails, useSavePreferences, usePublishRoom, useUploadRoomPhoto, useDeleteRoomPhoto, useUpdateRoom, useUpdateRoomStatus, useDeleteRoom, useRegenerateShareLink, useUpdateShareLinkSettings, useMarkApplicationsSeen, useSubmitReview, useUpdateApplicantStatus, useCreateEvent, useUpdateEvent, useCancelEvent, useBatchInvite, useSubmitVotes, useCloseRoom | None                        |
| `onboarding.ts`    | useSubmitIdentity, useVerifyEmail, useResendCode, useSubmitAbout, useSubmitBio, useSubmitPersonality, useSubmitLanguages                                                                                                                                                                                                                                                                                              | None                        |
| `settings.ts`      | useUpdateConsent, useRevokeSession, useExportData, useSubmitDataRequest, useDeleteAccount                                                                                                                                                                                                                                                                                                                             | None                        |
| `chat.ts`          | useSendMessage, useMarkConversationRead, useOpenConversation                                                                                                                                                                                                                                                                                                                                                          | useSendMessage has rollback |
| `profile.ts`       | useUpdateProfile, useUploadProfilePhoto, useDeleteProfilePhoto                                                                                                                                                                                                                                                                                                                                                        | None                        |
| `house.ts`         | useRegenerateInviteCode, useJoinHouse                                                                                                                                                                                                                                                                                                                                                                                 | None                        |
| `notifications.ts` | useMarkNotificationRead, useMarkAllNotificationsRead                                                                                                                                                                                                                                                                                                                                                                  | None                        |
| `rooms.ts`         | useApplyToRoom                                                                                                                                                                                                                                                                                                                                                                                                        | Has rollback                |
| `applications.ts`  | useWithdrawApplication                                                                                                                                                                                                                                                                                                                                                                                                | None                        |
| `invitations.ts`   | useRespondToInvitation                                                                                                                                                                                                                                                                                                                                                                                                | None                        |
| `verification.ts`  | useSaveVerification                                                                                                                                                                                                                                                                                                                                                                                                   | None (local SQLite, skip?)  |

**Note:** `useSaveVerification` writes to local SQLite only (no network). Skip toast for this one.

---

## Verification Checklist

After completing this phase:

```bash
pnpm --filter @openhospi/mobile typecheck
pnpm --filter @openhospi/mobile lint
```

- [ ] MMKV storage reads/writes work synchronously
- [ ] Haptic feedback triggers on button press (test on real device)
- [ ] Toast appears on mutation error (toggle airplane mode, try an action)
- [ ] Toast auto-dismisses (3s success, 5s error)
- [ ] Toast shows correct color per type (red error, green success, dark info)
- [ ] @gorhom/bottom-sheet renders with app theme, snap points work
- [ ] Bottom sheet keyboard avoidance works (open sheet with text input, open keyboard)
- [ ] FlashList renders room cards with `estimatedItemSize`
- [ ] `expo-maps` renders on iOS (Apple Maps) and Android (Google Maps)
- [ ] Privacy circle renders on map with correct 300m radius + offset
- [ ] expo-image loads photos with `cachePolicy="disk"` (verify in room-card, photo-carousel)
- [ ] All 5 skeleton variants render correctly
- [ ] Swipeable row reveals action buttons on swipe, springs back below threshold
- [ ] Filter state persists across app restarts (MMKV) and resets with `resetFilters()`
- [ ] Pinch-to-zoom works on photo carousel, springs back on release
- [ ] AnimatedPressable scales down on press + haptic fires
- [ ] All 48 mutations have `onError` callbacks (verify with `grep -r "onError"`)
- [ ] Biometric prompt shows on supported devices (Face ID, fingerprint)
- [ ] Step indicator dots animate correctly (active dot becomes pill)
