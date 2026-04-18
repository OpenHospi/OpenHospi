# CLAUDE.md — Mobile App (`apps/mobile`)

See root `CLAUDE.md` for project-wide conventions (coding philosophy, git, enums, i18n zero-duplication rule). This file
covers mobile-specific details.

## Stack

| Layer      | Technology                                                                                      |
| ---------- | ----------------------------------------------------------------------------------------------- |
| Framework  | Expo SDK 55, React Native 0.83, Expo Router v4, New Architecture                                |
| Styling    | `StyleSheet.create` + `useTheme()` hook — NO Tailwind, NO className                             |
| Design     | `src/design/` — tokens (colors, spacing, typography, radius, shadows, glass) + ThemeProvider    |
| UI         | `@expo/ui` (SwiftUI iOS / Jetpack Compose Android) + custom in `components/native/` + `layout/` |
| Glass      | iOS 26 Liquid Glass via `expo-glass-effect` with `expo-blur` fallback on iOS 16.1–25            |
| Dyn color  | Material You on Android 12+ via `@pchmn/expo-material3-theme` with Soft Teal fallback           |
| Animations | react-native-reanimated v4 + `useReducedMotion()` gates decorative animations                   |
| Icons      | SF Symbols (`expo-symbols`) iOS + `@expo/vector-icons/MaterialSymbols` Android                  |
| Menus      | `@expo/ui` — SwiftUI ContextMenu/Menu (iOS), Jetpack Compose DropdownMenu (Android)             |
| Sheets     | Expo Router `presentation: 'formSheet'` (iOS detents + grabber). No `@gorhom/bottom-sheet`.     |
| i18n       | react-i18next + i18next-icu — NOT next-intl                                                     |
| Auth       | Better Auth Expo client (`@better-auth/expo`)                                                   |
| Data       | React Query (`@tanstack/react-query` v5) + REST to Next.js backend                              |
| Lists      | `@shopify/flash-list` v2 — NOT FlatList                                                         |
| Chat UI    | `react-native-gifted-chat` with custom `renderBubble`/`renderMessageText`                       |
| Photo pgr  | `react-native-pager-view` (native `UIPageViewController` + Android `ViewPager`)                 |
| Local DB   | expo-sqlite + Drizzle ORM (cache + E2EE protocol state)                                         |
| E2EE       | `@openhospi/crypto` + `react-native-quick-crypto` (Signal Protocol)                             |
| Realtime   | Supabase Broadcast (WebSocket) — chat only                                                      |
| Backend    | **Next.js API** (apps/web) — NOT Expo API routes                                                |
| Monitoring | Sentry (`@sentry/react-native`)                                                                 |
| Compiler   | React Compiler (enabled via `experiments.reactCompiler`)                                        |

## Platform floors

- iOS 16.1+ (`ios.deploymentTarget: '16.1'` in `app.config.ts` via `expo-build-properties`)
- Android API 24+ (Android 7)
- iOS 26 Liquid Glass is layered on top via `isGlassEffectAPIAvailable()` runtime check
- Android 12+ gets Material You dynamic color overlay; earlier Android falls back to Soft Teal

## Styling

### All styles via `StyleSheet.create` + `useTheme()`

Every component uses `StyleSheet.create` for static styles and `useTheme()` for dynamic theme-dependent values.

```tsx
import { StyleSheet, View } from 'react-native';
import { useTheme } from '@/design';
import { Text } from '@/components/native/text';

export function MyComponent() {
  const { colors, spacing } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text variant="headline">Title</Text>
      <Text variant="body" color={colors.tertiaryForeground}>
        Subtitle
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
});
```

### Design tokens

- **Colors:** `useTheme().colors` — semantic tokens (background hierarchy, foreground hierarchy, primary, destructive, muted, accent, separator, border, ring, notification, and glass-on-surface tokens: `primaryGlass`, `primaryGlassForeground`, `separatorOnGlass`)
- **Glass:** `useTheme().glass` — fallback blur intensity, overlay opacity, `borderOnGlass`, `primaryOnGlass`, `foregroundOnGlass`, `separatorOnGlass` (see `tokens/glass.ts`)
- **Typography:** `useTheme().typography` — iOS semantic scale
- **Spacing:** `useTheme().spacing` — base-4 scale
- **Radius:** `useTheme().radius` — platform-specific
- **Shadows:** `shadow()` from `@/design/tokens/shadows`

### Theme preferences

```tsx
const { colorSchemePreference, setColorSchemePreference, useDynamicColor, setUseDynamicColor } =
  useTheme();

setColorSchemePreference('dark'); // 'light' | 'dark' | 'system' — persisted to MMKV
setUseDynamicColor(false); // Android 12+ Material You toggle — persisted to MMKV
```

Dynamic-color overlay only touches brand tokens (`primary`, `primaryForeground`, `accent`, `accentForeground`, `ring`). Semantic tokens `destructive`, `success`, `warning` stay fixed across themes.

### Platform differences

`Platform.select`, `isIOS`, `isAndroid`, `platformSelect()` from `@/lib/platform`. Runtime capability flags from `@/lib/platform-capabilities`:

```tsx
import { isGlassEffectAPIAvailable, isMaterialYouAvailable } from '@/lib/platform-capabilities';
```

## `@expo/ui` primitive pattern (Metro platform extensions)

Platform-specific primitives use Metro's `.ios.tsx` / `.android.tsx` resolution so screens import from one path without `Platform.OS` branching:

```
components/native/button/
  index.tsx            // re-exports types + component (Metro picks platform file)
  button.types.ts      // shared prop types
  button.ios.tsx       // @expo/ui/swift-ui Button in Host
  button.android.tsx   // @expo/ui/jetpack-compose Button in Host
```

**Never write `if (Platform.OS === 'ios')` branches inside screens.** Always resolve at the primitive layer via Metro extensions.

### `Host` sizing and touch rules

- `@expo/ui` primitives mount SwiftUI/Compose content inside a `Host` view. Parents must pin a concrete `height` (single-line controls) or set `matchContents` (multi-line / auto-growing content).
- **Wrapping a `Host` in an outer `Pressable` does not forward touches.** Either use the primitive's built-in press handler or render an overlay `Pressable` sibling inside the Host content.
- Inside `FlashList`: give each row a stable `key`. If recycling flickers a Host-based cell, fall back to an RN implementation for that specific cell.

### Accessibility props

Every primitive's prop types must expose:

- `accessibilityRole`
- `accessibilityLabel`
- `accessibilityState` (for toggles, buttons, selected items)
- `accessibilityValue` (sliders, progress, steppers)
- `accessibilityHint` (when action isn't obvious from the label)

Baked into primitive prop types from Phase B onward — never retrofitted later.

## Native Design Patterns

### iOS patterns

- **Large titles** on all 5 main tabs + top-level details (Settings, Room detail, My House, Application detail)
- **Transparent glass headers** on iOS 26 via `headerTransparent: true` + `headerBlurEffect: 'regular'`. On iOS <26 the same config renders standard blur.
- **`Stack.SearchBar`** — fragment root + `contentInsetAdjustmentBehavior="automatic"` (see feedback memory)
- **Native sheets** via Expo Router `presentation: 'formSheet'` (detents, grabber, native corner radius)
- **Native alerts** via `Alert.alert()` — NOT custom dialog overlays
- **SF Symbols** via `expo-symbols`
- **Background hierarchy** for depth — NOT borders and shadows

### Android patterns

- **Edge-to-edge** is the default in Expo SDK 54+ (no config key required). `android.predictiveBackGestureEnabled: true` is set in `app.config.ts`.
- **Material ripple** via `android_ripple` prop on Pressable (theme-aware color)
- **Elevation** via `shadow()` tokens
- **Material Symbols** via `@expo/vector-icons/MaterialSymbols`
- **Material You dynamic color** when wallpaper seed available (Android 12+) — toggleable in Settings

### Predictive back gesture (Android 13+ / full animations Android 14-15+)

Opt-in is **app-wide** via `android.predictiveBackGestureEnabled: true` in `app.config.ts`, which sets `android:enableOnBackInvokedCallback="true"` in the AndroidManifest. This unlocks the system back-to-home, cross-task, and cross-activity animations on supported devices.

Rules for screens that intercept back:

- **Never** call `BackHandler.addEventListener('hardwareBackPress', …)` for new code — that API predates predictive back and blocks the gesture preview. Use React Navigation's `useFocusEffect` + `beforeRemove` listener, or Expo Router's `useNavigation().addListener('beforeRemove', …)`.
- For modal screens that need a "discard changes?" confirm, prefer the navigation `beforeRemove` pattern so the system preview still animates toward the underlying screen.
- Runtime availability: `isPredictiveBackAvailable()` from `@/lib/platform-capabilities` returns `true` on Android 13+.

### PlatformSurface

Unified surface component at `components/layout/platform-surface.tsx` — one import, variant drives output:

```tsx
<PlatformSurface variant="chrome" edge="top" glass="regular">
  <NavHeader />
</PlatformSurface>
```

| Platform | Variant | Impl                                                  |
| -------- | ------- | ----------------------------------------------------- |
| iOS 26+  | chrome  | `GlassView` with `glassEffectStyle`                   |
| iOS <26  | chrome  | `expo-blur` BlurView + overlay + hairline             |
| iOS any  | card    | solid `colors.card` + `shadow('sm')`                  |
| iOS any  | grouped | `colors.secondaryBackground` + `radius.lg`            |
| iOS any  | modal   | `colors.background`                                   |
| Android  | chrome  | solid `colors.background` + hairline + `elevation: 2` |
| Android  | card    | `colors.card` + `shadow('md')`                        |
| Android  | grouped | `colors.secondaryBackground` + `radius.lg`            |
| Android  | modal   | `colors.background`                                   |

### Haptics

Conservative — meaningful actions only. Helpers in `@/lib/haptics`: `hapticLight`, `hapticToggle`, `hapticPullToRefreshSnap`, `hapticSheetSnap`, `hapticDelete`, `hapticFormSubmitSuccess`, `hapticFormSubmitError`, `hapticPinEntry`, `hapticZoom`, etc.

### Lists

Always `FlashList` from `@shopify/flash-list` v2. No `estimatedItemSize`.

### Loading states

Shimmer skeletons (`Skeleton` from `components/native/skeleton.tsx`) for list placeholders. `@expo/ui` `ProgressView` for indeterminate spinners + pull-to-refresh overlays. Never a full-screen `ActivityIndicator`.

### Empty states

`NativeEmptyState` from `components/feedback/native-empty-state.tsx` with SF Symbols iOS + Material Symbols Android.

## Navigation

- Expo Router v4, file-based routing in `src/app/`
- `NativeTabs` from `expo-router/unstable-native-tabs` with `blurEffect="systemMaterial"` + iOS 26 `NativeTabs.BottomAccessory` where applicable
- Route groups: `(auth)/`, `(onboarding)/`, `(app)/` → `(tabs)/` + `(modals)/` + detail screens
- Typed routes enabled

### Typed Routes

```tsx
router.push({ pathname: '/(app)/room/[id]', params: { id } }); // ✓ typed params
router.push('/(app)/(modals)/filter-sheet'); // ✓ static route
router.push(`/(app)/room/${id}`); // ✗ bypasses types
```

## Component Conventions

### `components/native/` — primitives

Platform-split via Metro `.ios.tsx` / `.android.tsx` directories: `button/`, `text-field/`, `textarea/`, `toggle/`, `picker/`, `select/`, `progress/`, `checkbox/`.

Single-file RN primitives: `text.tsx`, `divider.tsx`, `badge.tsx`, `skeleton.tsx`, `avatar.tsx`, `input.tsx` (RN-fallback input; `text-field/` is the `@expo/ui` variant).

### `components/layout/` — structural

- `platform-surface.tsx` — unified glass/card/grouped/modal surface
- `grouped-section.tsx` — iOS Settings-style rounded section
- `list-cell.tsx` — standard row (label, value, chevron)
- `status-pill.tsx` — tinted status indicator

### Domain components

`components/{chat,rooms,profile,forms,events,feedback,navigation,shared}/`

### Form bridge pattern

`@expo/ui` SwiftUI `TextField` is uncontrolled. Bridge via `react-hook-form` `Controller`:

```tsx
<Controller
  control={control}
  name="email"
  render={({ field }) => (
    <TextField
      defaultValue={field.value ?? ''}
      onChangeText={field.onChange}
      onFocusChange={(focused) => !focused && field.onBlur()}
    />
  )}
/>
```

For `form.reset()`, bump a `formResetCounter` in state and pass `key={formResetCounter}` to the form subtree to remount. Gate edit-form render on `query.isSuccess` so the initial `defaultValue` is correct.

## Import Conventions

```tsx
import { useTheme } from '@/design';
import { shadow } from '@/design/tokens/shadows';

import { PlatformSurface } from '@/components/layout/platform-surface';
import { GroupedSection } from '@/components/layout/grouped-section';
import { ListCell } from '@/components/layout/list-cell';
import { Text } from '@/components/native/text';
import { Button } from '@/components/native/button';

import { RoomCard } from '@/components/rooms/room-card';
import { MessageBubble } from '@/components/chat/message-bubble';

import { hapticLight } from '@/lib/haptics';
import { isIOS } from '@/lib/platform';
import { isGlassEffectAPIAvailable } from '@/lib/platform-capabilities';
```

## Data Fetching & Services

REST wrapper in `src/lib/api-client.ts`. React Query v5 (`src/lib/query-client.ts`). Query keys in `src/services/keys.ts`. Hooks per domain in `src/services/`.

## Auth

Better Auth Expo client in `src/lib/auth-client.ts`. Token storage via `expo-secure-store`. Login via InAcademia OIDC. Auth guard in root `_layout.tsx`.

## i18n

`react-i18next` + `i18next-icu`. Resources from `@openhospi/i18n/app` (merges `shared.json` + `app.json`). Shared labels in `common.labels`.

## E2EE Chat

Signal Protocol via `@openhospi/crypto`. Key storage: SQLite + SecureStore. Realtime: Supabase Broadcast per `chat:${conversationId}` channel. Chat UI via `react-native-gifted-chat` with custom `renderBubble`/`renderMessageText`/`renderMessageImage` — encrypt before `onSend`, decrypt before building the message prop.

## Local Database (SQLite + Drizzle)

`expo-sqlite` + Drizzle ORM, schema in `src/lib/db/schema.ts`. `babel-plugin-inline-import` required for Drizzle migrations. Never hand-edit migration files — run `pnpm db:mobile:generate`.

## Environment Variables

All client-exposed use `EXPO_PUBLIC_` prefix.

## Don'ts

- **`className` prop / Tailwind / Uniwind** — mobile uses StyleSheet only
- **`cn()` utility** — does not exist on mobile
- **Hardcoded colors / font sizes** — always `useTheme()`
- **`FlatList`** — use FlashList
- **`ActivityIndicator` for full-screen loading** — use Skeleton
- **`@gorhom/bottom-sheet`** — removed; use Expo Router formSheet
- **`lucide-react-native`** — removed; SF Symbols + Material Symbols only
- **`forwardRef`** — React 19 passes `ref` as a prop
- **Manual `useMemo`/`useCallback`** — React Compiler handles memoization
- **`if (Platform.OS === 'ios')` inside screens** — resolve at the primitive layer via Metro `.ios.tsx` / `.android.tsx`
- **Wrapping a `Host` in outer `Pressable`** — touches won't forward; use the primitive's own press handler
- **`@rn-primitives/*`** — removed entirely
- **`as` type assertions** — fix types properly (except `as const` and `Platform.select() as number`)
- **Custom dialog overlays** — use `Alert.alert()` or formSheet
- **Hardcoded enum strings** — use companion objects from `@openhospi/shared/enums`
- **next-intl imports** — mobile uses react-i18next
- **TODO comments** — fix it now or create an issue
- **Direct Supabase data queries** — all data goes through Next.js REST API

## Project Structure

```
src/
  @types/
    i18next.d.ts
  app/
    _layout.tsx              # Root: Sentry, crypto, ThemeProvider, auth guard
    index.tsx                # Session check, routing
    +not-found.tsx
    (auth)/login.tsx
    (onboarding)/
      index.tsx
      steps/                 # about, bio, identity, languages, personality, photos, security
    (app)/
      _layout.tsx            # App shell with ConnectionStatusBar
      (tabs)/
        _layout.tsx          # NativeTabs with blurEffect
        discover/
        my-rooms/
        chat/
        applications.tsx
        profile.tsx
      (modals)/              # FormSheet modals (edit-*, filter-sheet, apply-sheet)
      room/[id].tsx
      application/[id].tsx
      settings.tsx
      my-house.tsx
      join/[code].tsx
  design/
    tokens/
      colors.ts              # Semantic color tokens (light/dark) + glass tokens
      glass.ts               # iOS 26 glass + fallback blur tokens
      dynamic-color.ts       # Material You overlay hook
      spacing.ts
      typography.ts
      radius.ts
      shadows.ts
    theme.tsx                # ThemeProvider + useTheme() + preference state + MMKV
    index.ts
  components/
    native/                  # Text, Button, TextField, Input, Toggle, Picker, Select,
                             # Progress, Checkbox, Badge, Divider, Avatar, Skeleton, Textarea
                             # (platform-split via Metro .ios.tsx / .android.tsx where applicable)
    layout/                  # PlatformSurface, GroupedSection, ListCell, StatusPill
    feedback/                # NativeEmptyState, ErrorState, Skeleton, Toast
    navigation/
    chat/                    # MessageBubble, ChatInputBar, ConversationListItem
    rooms/                   # RoomCard, MyRoomCard, PhotoCarousel
    profile/
    forms/
    events/
    shared/
  context/
    session.tsx
    discover-filters.tsx
    toast.tsx
  hooks/
    use-encryption.ts
    use-toast.ts
  i18n/index.ts
  lib/
    api-client.ts
    auth-client.ts
    supabase.ts
    query-client.ts
    platform.ts              # isIOS, isAndroid, platformSelect()
    platform-capabilities.ts # isGlassEffectAPIAvailable, isMaterialYouAvailable, isEdgeToEdgeNative
    haptics.ts
    animations.ts
    action-sheet.ts
    biometric.ts, mmkv.ts, network.ts, constants.ts, mutation-error.ts
    crypto/
    db/
  services/
```

## Verification

```bash
pnpm --filter @openhospi/mobile lint
pnpm --filter @openhospi/mobile typecheck
pnpm dev:mobile
```
