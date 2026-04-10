# CLAUDE.md — Mobile App (`apps/mobile`)

See root `CLAUDE.md` for project-wide conventions (coding philosophy, git, enums, i18n zero-duplication rule). This file
covers mobile-specific details.

## Stack

| Layer      | Technology                                                                            |
| ---------- | ------------------------------------------------------------------------------------- |
| Framework  | Expo SDK 55, React Native 0.83, Expo Router v4                                        |
| Styling    | `StyleSheet.create` + `useTheme()` hook — NO Tailwind, NO className                   |
| Design     | `src/design/` — tokens (colors, spacing, typography, radius, shadows) + ThemeProvider |
| UI         | Custom native components in `components/primitives/` + `components/layout/`           |
| Animations | react-native-reanimated v4                                                            |
| Icons      | `lucide-react-native` + SF Symbols (`expo-symbols`) + `@expo/vector-icons` fallback   |
| Menus      | `@expo/ui` — SwiftUI ContextMenu/Menu (iOS), Jetpack Compose DropdownMenu (Android)   |
| i18n       | react-i18next + i18next-icu — NOT next-intl                                           |
| Auth       | Better Auth Expo client (`@better-auth/expo`)                                         |
| Data       | React Query (`@tanstack/react-query` v5) + REST to Next.js backend                    |
| Lists      | `@shopify/flash-list` v2 — NOT FlatList                                               |
| Local DB   | expo-sqlite + Drizzle ORM (cache + E2EE protocol state)                               |
| E2EE       | `@openhospi/crypto` + `react-native-quick-crypto` (Signal Protocol)                   |
| Realtime   | Supabase Broadcast (WebSocket) — chat only                                            |
| Backend    | **Next.js API** (apps/web) — NOT Expo API routes                                      |
| Monitoring | Sentry (`@sentry/react-native`)                                                       |
| Compiler   | React Compiler (enabled via `experiments.reactCompiler`)                              |

## Styling

### All styles via `StyleSheet.create` + `useTheme()`

Every component uses `StyleSheet.create` for static styles at the bottom of the file, and `useTheme()` from `@/design`
for dynamic theme-dependent values (colors, spacing, typography).

```tsx
import { StyleSheet, View } from 'react-native';
import { useTheme } from '@/design';
import { ThemedText } from '@/components/primitives/themed-text';

export function MyComponent() {
  const { colors, spacing, typography } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ThemedText variant="headline">Title</ThemedText>
      <ThemedText variant="body" color={colors.tertiaryForeground}>
        Subtitle
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
});
```

### Design tokens

All design values come from `src/design/tokens/`:

- **Colors:** `useTheme().colors` — semantic tokens (background, foreground, primary, destructive, muted, etc.) with light/dark variants
- **Typography:** `useTheme().typography` — iOS semantic scale (largeTitle, title1, title2, title3, headline, body, callout, subheadline, footnote, caption1, caption2)
- **Spacing:** `useTheme().spacing` — base-4 scale (xs=4, sm=8, md=12, lg=16, xl=20, 2xl=24, 3xl=32, 4xl=40, 5xl=48)
- **Radius:** `radius` from `@/design/tokens/radius` — platform-specific (iOS slightly larger than Android)
- **Shadows:** `shadow()` from `@/design/tokens/shadows` — iOS shadow props vs Android elevation

### Platform differences

Use `Platform.select`, `isIOS`, or `isAndroid` from `@/lib/platform`:

```tsx
import { isIOS } from '@/lib/platform';

// iOS: ripple doesn't exist, use opacity feedback
// Android: use android_ripple prop
```

## Native Design Patterns

### iOS patterns

- **GroupedSection** (`components/layout/grouped-section.tsx`) for iOS Settings-style grouped lists — replaces Card
- **ListCell** (`components/layout/list-cell.tsx`) for standard list rows with label, value, and chevron
- **ListSeparator** (`components/layout/list-separator.tsx`) for hairline separators (0.5px on iOS, 1px on Android)
- **Background hierarchy** for depth — NOT borders and shadows. Depth comes from background color differences (background → secondaryBackground → tertiaryBackground)
- **Large titles** on main tab screens via `headerLargeTitle: true`
- **Blur headers** via `headerTransparent: true` + `headerBlurEffect: 'regular'`
- **SF Symbols** via `expo-symbols` for native iOS icons
- **Native sheets** via `presentation: 'formSheet'` — NOT custom dialog overlays
- **Native alerts** via `Alert.alert()` — NOT custom alert dialog components
- **Action sheets** via `showActionSheet()` from `@/lib/action-sheet` for destructive choices

### Android patterns

- **Elevation** via `shadow()` from design tokens — NOT CSS shadow classes
- **Material ripple** via `android_ripple` prop on Pressable
- **1px separators** (full-width) instead of iOS hairline with inset

### Context menus

Use `@expo/ui` for native menus — platform-specific imports:

```tsx
// iOS — SwiftUI ContextMenu (long-press) and Menu (tap)
import { ContextMenu, Menu, Button } from '@expo/ui/swift-ui';

// Android — Jetpack Compose DropdownMenu
import { DropdownMenu, DropdownMenuItem } from '@expo/ui/jetpack-compose';
```

Use `Platform.OS` to pick the right implementation per platform. Never import SwiftUI components on Android or Jetpack Compose components on iOS.

### Haptics

Every interactive element should have haptic feedback. Use contextual helpers from `@/lib/haptics`:

- `hapticLight` — button taps, selections
- `hapticToggle` — switch/checkbox toggles
- `hapticPullToRefreshSnap` — pull-to-refresh snap
- `hapticSheetSnap` — bottom sheet snap
- `hapticDelete` — destructive actions
- `hapticFormSubmitSuccess/Error` — form submission results
- `hapticPinEntry` — PIN digit entry
- `hapticZoom` — pinch zoom thresholds

### Lists

Always use `FlashList` from `@shopify/flash-list`, never `FlatList`. FlashList v2 does NOT use `estimatedItemSize` (removed in v2).

### Loading states

Use skeleton placeholders (`ThemedSkeleton` from `components/primitives/`), never full-screen `ActivityIndicator`. Match skeleton dimensions to the real content layout.

### Empty states

Use `NativeEmptyState` from `components/feedback/native-empty-state.tsx` with SF Symbols on iOS and Lucide icons on Android.

## Navigation

- **Expo Router v4** with file-based routing in `src/app/`
- **NativeTabs** from `expo-router/unstable-native-tabs` with `blurEffect="systemMaterial"` for frosted glass tab bar
- Route groups:
  - `(auth)/` — Login screen
  - `(onboarding)/` — Onboarding flow
  - `(app)/` — Authenticated app shell
    - `(tabs)/` — Bottom tabs: discover, my-rooms, chat, applications, profile
    - `(modals)/` — Modal screens (edit-\*, filter-sheet, apply-sheet, key-recovery)
    - `room/[id].tsx`, `application/[id].tsx`, `settings.tsx`
- Icons: SF Symbols via `expo-symbols` (iOS), `@expo/vector-icons` Material (Android)
- Typed routes enabled (`experiments.typedRoutes: true`)
- Screen transitions: `animation: 'slide_from_right'` on detail screens

### Typed Routes

```tsx
// CORRECT — typed pathname + params
router.push({ pathname: '/(app)/room/[id]', params: { id } });

// CORRECT — string form for static routes
router.push('/(app)/(modals)/filter-sheet');

// WRONG — string interpolation bypasses type checking
router.push(`/(app)/room/${id}`);
```

## Component Conventions

### Primitives (`components/primitives/`)

Base native components that replace the old @rn-primitives registry:

- `ThemedText` — typography with semantic variants (body, headline, title2, caption1, etc.)
- `ThemedButton` — pressable with variants (primary, secondary, outline, ghost, destructive), haptic, loading state
- `ThemedInput` — styled TextInput with focus/error states
- `ThemedTextarea` — multiline input
- `ThemedBadge` — native pill/chip
- `ThemedAvatar` — circular image with initials fallback
- `ThemedSwitch` — native RN Switch with theme colors + haptic
- `ThemedProgress` — Reanimated animated progress bar
- `ThemedSkeleton` — Reanimated shimmer placeholder
- `ThemedCheckbox` — custom checkbox with haptic
- `NativeSelect` — trigger that opens a bottom sheet picker

### Layout (`components/layout/`)

iOS-native structural components:

- `GroupedSection` — iOS Settings-style rounded section container (replaces Card)
- `ListCell` — standard row with label, value, chevron, haptic
- `ListSeparator` — platform-aware hairline
- `StatusPill` — small tinted status indicator

### Domain components

Organized by feature domain:

- `components/chat/` — MessageBubble, ChatInputBar, ConversationListItem, etc.
- `components/rooms/` — RoomCard, MyRoomCard, PhotoCarousel, etc.
- `components/profile/` — ProfileFieldRow, ProfileSectionCard, VerificationBadge
- `components/forms/` — ChipPicker, CitySearch, DatePickerSheet, InputOTP, etc.
- `components/events/` — HospiInvitationCard
- `components/feedback/` — NativeEmptyState, ErrorState, Skeleton, Toast, ConnectionStatusBar
- `components/navigation/` — ScrollToBottomFab
- `components/shared/` — AnimatedPressable, BottomSheet, Logo, SwipeableRow, etc.

## Import Conventions

```tsx
// Design system
import { useTheme } from '@/design';
import { spacing } from '@/design/tokens/spacing';
import { radius } from '@/design/tokens/radius';
import { shadow } from '@/design/tokens/shadows';

// Primitives
import { ThemedText } from '@/components/primitives/themed-text';
import { ThemedButton } from '@/components/primitives/themed-button';

// Layout
import { GroupedSection } from '@/components/layout/grouped-section';
import { ListCell } from '@/components/layout/list-cell';

// Domain components
import { RoomCard } from '@/components/rooms/room-card';
import { MessageBubble } from '@/components/chat/message-bubble';

// Utilities
import { hapticLight } from '@/lib/haptics';
import { isIOS } from '@/lib/platform';
```

## Data Fetching & Services

### API Client

REST wrapper in `src/lib/api-client.ts` — thin `fetch` wrapper with `ApiError` class. All requests go to Next.js backend.

### React Query

All server state via `@tanstack/react-query` v5. Query client in `src/lib/query-client.ts`.

### Query Key Factory

Centralized in `src/services/keys.ts`.

### Service Layer

Each file in `src/services/` exports React Query hooks (useConversations, useRooms, useProfile, etc.).

## Auth

- **Better Auth Expo** client via `@better-auth/expo` in `src/lib/auth-client.ts`
- Token storage: `expo-secure-store`
- Login: InAcademia OIDC (SURFconext)
- Auth guard in root `_layout.tsx`

## i18n

- **react-i18next** with `i18next-icu` plugin — NOT next-intl
- Resources from `@openhospi/i18n/app` (merges `shared.json` + `app.json`)
- Shared labels in `common.labels`

## E2EE Chat

- `@openhospi/crypto` — Signal Protocol (ECDH P-256, HKDF, AES-256-GCM, Sender Keys)
- Key storage: SQLite + SecureStore
- Protocol store: `src/lib/crypto/stores/index.ts`
- Encryption hooks: `src/hooks/use-encryption.ts`
- Realtime: Supabase Broadcast per `chat:${conversationId}` channel

## Local Database (SQLite + Drizzle)

- `expo-sqlite` + Drizzle ORM, schema in `src/lib/db/schema.ts`
- `babel.config.js` MUST stay — `babel-plugin-inline-import` required for Drizzle migrations
- Never create migration files manually — use `pnpm db:mobile:generate`

## Environment Variables

All client-exposed use `EXPO_PUBLIC_` prefix: `EXPO_PUBLIC_API_URL`, `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_KEY`, `EXPO_PUBLIC_SENTRY_DSN`.

## Don'ts

- **`className` prop** — app uses StyleSheet, not Tailwind
- **`cn()` utility** — deleted, does not exist
- **Hardcoded colors** — use `useTheme().colors`
- **Hardcoded font sizes** — use `useTheme().typography` variants
- **`FlatList`** — use FlashList from `@shopify/flash-list`
- **`ActivityIndicator` for full-screen loading** — use ThemedSkeleton placeholders
- **`Card`, `Badge`, `Select` from old ui/** — those files are deleted. Use primitives/layout components
- **`@rn-primitives/*`** — removed entirely. Use native components
- **`as` type assertions** — fix types properly (except `as const` and `Platform.select() as number`)
- **Web-style shadows** — use `shadow()` from design/tokens/shadows
- **Bordered cards for sections** — use GroupedSection with background hierarchy
- **Custom dialog overlays** — use `Alert.alert()` or formSheet
- **Dashed-border empty states** — use NativeEmptyState with SF Symbols
- **`forwardRef`** — React 19 passes ref as a prop
- **Manual `useMemo`/`useCallback`** — React Compiler handles memoization
- **Hardcoded enum strings** — use companion objects from `@openhospi/shared/enums`
- **next-intl imports** — mobile uses react-i18next
- **TODO comments** — fix it now or create an issue
- **Direct Supabase data queries** — all data goes through Next.js REST API
- **`as never` on route paths** — use proper typed pathnames
- **Components in `components/` root** — all components live in domain subdirectories

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
      index.tsx              # Onboarding flow
      steps/                 # about, bio, identity, languages, personality, photos, security
    (app)/
      _layout.tsx            # App shell with ConnectionStatusBar
      (tabs)/
        _layout.tsx          # NativeTabs with blurEffect
        discover/            # Room discovery
        my-rooms/            # Room management + creation wizard
        chat/                # Conversations + threads
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
      colors.ts              # Semantic color tokens (light/dark)
      spacing.ts             # Base-4 spacing scale
      typography.ts          # iOS semantic type scale
      radius.ts              # Platform-specific corner radii
      shadows.ts             # Native shadow helpers
    theme.ts                 # ThemeProvider + useTheme() hook
    index.ts                 # Re-exports
  components/
    primitives/              # ThemedText, ThemedButton, ThemedInput, etc.
    layout/                  # GroupedSection, ListCell, ListSeparator, StatusPill
    feedback/                # NativeEmptyState, ErrorState, Skeleton, Toast
    navigation/              # ScrollToBottomFab
    chat/                    # MessageBubble, ChatInputBar, ConversationListItem
    rooms/                   # RoomCard, MyRoomCard, PhotoCarousel
    profile/                 # ProfileFieldRow, ProfileSectionCard
    forms/                   # ChipPicker, CitySearch, DatePickerSheet, InputOTP
    events/                  # HospiInvitationCard
    shared/                  # AnimatedPressable, BottomSheet, Logo, SwipeableRow
  context/
    session.tsx              # Auth + onboarding state
    discover-filters.tsx     # Discovery filters (MMKV)
    toast.tsx                # Toast notifications
  hooks/
    use-encryption.ts        # E2EE encryption context
    use-toast.ts
  i18n/index.ts              # react-i18next setup
  lib/
    api-client.ts            # REST API wrapper
    auth-client.ts           # Better Auth Expo client
    supabase.ts              # Realtime only
    query-client.ts          # React Query config
    platform.ts              # isIOS, isAndroid, platformSelect()
    haptics.ts               # Haptic feedback helpers (15 exports)
    animations.ts            # Reanimated presets (20 exports)
    action-sheet.ts          # Native action sheet (iOS/Android)
    biometric.ts, mmkv.ts, network.ts, constants.ts, mutation-error.ts
    crypto/                  # E2EE key storage
    db/                      # SQLite + Drizzle
  services/                  # API query hooks (chat, rooms, profile, etc.)
```

## Verification

```bash
pnpm --filter @openhospi/mobile lint
pnpm --filter @openhospi/mobile typecheck
pnpm dev:mobile  # start Expo dev server
```
