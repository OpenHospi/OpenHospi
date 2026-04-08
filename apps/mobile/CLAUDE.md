# CLAUDE.md — Mobile App (`apps/mobile`)

See root `CLAUDE.md` for project-wide conventions (coding philosophy, git, enums, i18n zero-duplication rule). This file
covers mobile-specific details.

## Skills

When working on the mobile app, use these skills for up-to-date guidance:

- `uniwind` — Tailwind CSS v4 for RN: styling, theming, className, `cn()`, `accent-` prefix
- `building-native-ui` — Expo Router navigation, animations, patterns, NativeTabs
- `native-data-fetching` — API calls, React Query, caching, offline, auth tokens
- `expo-dev-client` — Dev builds, TestFlight distribution
- `use-dom` — Web-only libraries in webview on native
- `upgrading-expo` — SDK upgrades, breaking changes
- `expo-deployment` — EAS builds, App Store, Play Store
- `expo-cicd-workflows` — EAS workflow YAML, CI/CD pipelines
- `better-auth-best-practices` — Auth server/client, sessions, plugins
- `better-auth-security-best-practices` — Rate limiting, CSRF, secrets
- `i18n-conventions` — Translation keys, namespaces, zero-duplication rule
- `drizzle-rls` — Server-side DB schema, RLS policies (when touching shared schema)
- `shadcn` — rn-primitives UI components

## Stack

| Layer      | Technology                                                                          |
| ---------- | ----------------------------------------------------------------------------------- |
| Framework  | Expo SDK 55, React Native 0.83, Expo Router v4                                      |
| Styling    | **Uniwind v1.6** (Tailwind CSS v4 for RN) — NOT NativeWind                          |
| UI         | @rn-primitives/\* (accordion, dialog, tabs, etc.) + custom components               |
| Animations | react-native-reanimated v4                                                          |
| Icons      | `lucide-react-native` + SF Symbols (`expo-symbols`) + `@expo/vector-icons` fallback |
| i18n       | react-i18next + i18next-icu — NOT next-intl                                         |
| Auth       | Better Auth Expo client (`@better-auth/expo`)                                       |
| Data       | React Query (`@tanstack/react-query` v5) + REST to Next.js backend                  |
| Local DB   | expo-sqlite + Drizzle ORM (cache + E2EE protocol state)                             |
| E2EE       | `@openhospi/crypto` + `react-native-quick-crypto` (Signal Protocol)                 |
| Realtime   | Supabase Broadcast (WebSocket) — chat only                                          |
| Backend    | **Next.js API** (apps/web) — NOT Expo API routes                                    |
| Monitoring | Sentry (`@sentry/react-native`)                                                     |
| Compiler   | React Compiler (enabled via `experiments.reactCompiler`)                            |

## Styling Rules (Uniwind)

### Use `style` for layout, `className` for visuals

Uniwind's `className` does NOT reliably handle layout properties on all components. Always split:

```tsx
// CORRECT
<View
    style={{flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24}}
    className="bg-background"
>

    // WRONG — layout via className breaks on SafeAreaView, Animated.View, etc.
    <View className="flex-1 items-center justify-center px-6 bg-background">
```

**Use `style` for:** `flex`, `flexDirection`, `justifyContent`, `alignItems`, `gap`, `padding*`, `margin*`, `width`,
`height`, `maxWidth`, `position`, `top/right/bottom/left`

**Use `className` for:** colors (`bg-*`, `text-*`, `border-*`), typography (`text-xl`, `font-semibold`,
`tracking-tight`), borders (`rounded-xl`, `border`), shadows (`shadow-sm`), opacity

### `accent-` prefix for non-style color props

For props that are NOT `style` (e.g. `tintColor`, `color`, `placeholderTextColor`), use the `accent-` prefix:

```tsx
// CORRECT — accent- prefix for non-style color props
<ActivityIndicator className="accent-primary"/>
<TextInput className="accent-muted-foreground" placeholder="Search..."/>

// WRONG — tintColor/color are not style properties
<ActivityIndicator className="text-primary"/>
```

### `withUniwind` only for third-party components

Only use `withUniwind()` to add className support to third-party components that don't have it. Never use it on RN core
components or Expo components (they already support className).

### `cn()` for class deduplication

Always use `cn()` (from `src/lib/utils.ts`) when merging conditional classes to avoid duplicate/conflicting styles:

```tsx
<View className={cn('bg-card rounded-xl', isActive && 'bg-primary')} />
```

### Do NOT use NativeWind APIs

The app uses **Uniwind**, not NativeWind. Do not use:

- `styled()` or `StyledComponent` from NativeWind
- `NativeWindStyleSheet` or `useColorScheme` from NativeWind
- `cssInterop` or `remapProps` from NativeWind
- Any import from `nativewind`

### Avoid `leading-none` on React Native Text

Tailwind's `leading-none` = `lineHeight: 1`. On web this is a multiplier. On React Native this is **1 pixel**, making
text invisible. Use explicit values like `leading-7`.

### Don't use dynamic classNames

Uniwind does NOT support dynamic string interpolation in classNames:

```tsx
// WRONG — class is not compiled
<Text className={`text-${color}`}>

    // CORRECT — use conditional or style
    <Text className={color === 'red' ? 'text-red-500' : 'text-blue-500'}>
```

### Don't rely on Card's TextClassContext

The shadcn Card wraps children in `TextClassContext.Provider`. This is unreliable in Uniwind — text can render
invisible. Always add explicit text color classes on every `Text` inside cards, or build card UIs with plain `View` +
explicit colors.

### `className` works on Animated.View

`Animated.View` from react-native-reanimated supports `className` directly — no `withUniwind()` wrapper needed. But
still use `style` for layout.

## Navigation

- **Expo Router v4** with file-based routing in `src/app/`
- **NativeTabs** from `expo-router/unstable-native-tabs` for the main tab bar (NOT `@react-navigation/bottom-tabs`)
- Route groups:
  - `(auth)/` — Login screen
  - `(onboarding)/` — Onboarding flow (separate route group, NOT inside `(auth)/`)
  - `(app)/` — Authenticated app shell
    - `(tabs)/` — Bottom tabs: discover, my-rooms, chat, applications, profile
    - `(modals)/` — Modal screens (edit-\*, filter-sheet, apply-sheet, key-recovery)
    - `room/[id].tsx`, `application/[id].tsx`, `settings.tsx`
- Icons: SF Symbols via `expo-symbols` (iOS), `lucide-react-native` + `@expo/vector-icons` fallback (Android)
- Typed routes enabled (`experiments.typedRoutes: true`)

### Typed Routes

Route types are auto-generated in `.expo/types/router.d.ts` when the dev server starts.

**`router.push/replace` — object form for dynamic routes:**

```tsx
// CORRECT — typed pathname + params
router.push({ pathname: '/(app)/room/[id]', params: { id } });
router.push({
  pathname: '/(app)/(tabs)/chat/[conversationId]/info',
  params: { conversationId },
});

// CORRECT — string form for static routes (no dynamic segments)
router.push('/(app)/(modals)/filter-sheet');
router.replace('/(app)/(tabs)/my-rooms');

// WRONG — string interpolation bypasses type checking
router.push(`/(app)/room/${id}`);
router.push(`/(app)/room/${id}` as never);
```

**`<Link>` — same rules apply:**

```tsx
// CORRECT
<Link href="/"/>
<Link href={{pathname: '/(app)/room/[id]', params: {id}}}/>

// WRONG
<Link href={'/' as never}/>
```

**`useLocalSearchParams` — manual type generic is fine:**

```tsx
// Preferred — explicit, readable
const { id } = useLocalSearchParams<{ id: string }>();
const { conversationId } = useLocalSearchParams<{ conversationId: string }>();
```

## Data Fetching & Services

### API Client

REST wrapper in `src/lib/api-client.ts`:

- Thin `fetch` wrapper with `ApiError` class
- Auto-includes `Cookie` header from Better Auth client
- Methods: `api.get()`, `api.post()`, `api.patch()`, `api.delete()`
- All requests go to Next.js backend (`API_BASE_URL` from constants)

### React Query

- All server state managed via React Query (`@tanstack/react-query` v5)
- Query client config in `src/lib/query-client.ts` (stale: 5min, GC: 30min, retry: 2)

### Query Key Factory

Centralized in `src/services/keys.ts`:

```tsx
import { queryKeys } from '@/services/keys';

// Usage in hooks
queryKey: queryKeys.rooms.list(filters);
queryKey: queryKeys.chat.messages(conversationId);
```

### Service Layer

Each file in `src/services/` exports React Query hooks:

- `chat.ts` — `useConversations()`, `useMessages()`, `useSendMessage()`
- `rooms.ts` — `useRooms()`, `useRoom()`, `useApplyToRoom()`
- `profile.ts` — `useProfile()`, `useUpdateProfile()`, `useUploadProfilePhoto()`
- `applications.ts` — `useApplications()`, `useApplicationDetail()`
- `onboarding.ts` — `useOnboardingStatus()`
- `invitations.ts` — `useInvitations()`
- `settings.ts` — `useSettings()`, `useConsentMutations()`, `useSessions()`
- `verification.ts` — `useVerificationStatus()`, `useIdentityKeys()`

## Auth

- **Better Auth Expo** client via `@better-auth/expo` in `src/lib/auth-client.ts`
- Token storage: `expo-secure-store`
- Login: InAcademia OIDC (SURFconext) via `expo-web-browser`
- Session context in `src/context/session.tsx` — provides `useSession`, handles auth + onboarding state
- Auth guard in root `_layout.tsx` — routes to `(app)`, `(onboarding)`, or `(auth)` based on session + onboarding status

## i18n

- **react-i18next** with `i18next-icu` plugin — NOT next-intl (that's web-only)
- Setup in `src/i18n/index.ts`
- Resources loaded from `@openhospi/i18n/app` (merges `shared.json` + `app.json`)
- Type definitions in `src/@types/i18next.d.ts`
- Use `useTranslation('translation', { keyPrefix: 'feature.section' })` pattern
- Shared labels live in `common.labels` — use `keyPrefix: 'common.labels'`
- Translation files: `packages/i18n/messages/{nl,en,de}/shared.json` and `app.json`

## E2EE Chat

### Crypto Stack

- **`@openhospi/crypto`** (workspace package) — Signal Protocol implementation (ECDH P-256, HKDF, AES-256-GCM, Sender
  Keys)
- **`react-native-quick-crypto`** — Native crypto polyfill (installed as Metro resolver alias for `crypto`)
- Polyfill installed in root `_layout.tsx` via `createNativeCryptoProvider()`

### Key Storage

- **Identity keys**: SQLite (`identityKeys` table) + backup encrypted in SecureStore
- **Session state**: SQLite tables (`sessions`, `preKeys`, `signedPreKeys`, `senderKeys`, `skippedKeys`)
- **Protocol store**: `src/lib/crypto/stores/index.ts` — `SqliteProtocolStore` implements the `ProtocolStore` interface
- **Secure storage**: `src/lib/crypto/secure-storage.ts` — wrapper around `expo-secure-store`

### Encryption Context

`src/hooks/use-encryption.ts` provides:

- `initializeDevice(pin)` — Generates device keys, registers with server, backs up encrypted identity key
- `ensureSessions(memberUserIds)` — Downloads prekey bundles, establishes Signal sessions
- `encryptMessage(conversationId, members, plaintext)` — Sender Key ratchet encryption
- `decryptMessage(messageId, conversationId, senderAddress, payload)` — Decryption via Sender Key
- `distributeSenderKey()` / `processIncomingDistribution()` — Key distribution management

### Realtime

- Supabase client in `src/lib/supabase.ts` — configured for **Realtime only** (`persistSession: false`)
- Chat screens subscribe to `chat:${conversationId}` Broadcast channel for live message updates
- All data queries go through the Next.js REST API, NOT through Supabase directly

## Local Database (SQLite + Drizzle)

- `expo-sqlite` provides the SQLite driver
- Drizzle ORM for type-safe queries
- Schema in `src/lib/db/schema.ts` — 12 tables for E2EE protocol state and local caching:
  - `identityKeys`, `preKeys`, `signedPreKeys` — Device key material
  - `sessions`, `senderKeys`, `skippedKeys` — Signal Protocol state
  - `localMessages` — Decrypted plaintext message cache
  - `trustedIdentities`, `keyVerifications` — TOFU & manual key verification
  - `preferences`, `cachedProfiles`, `messageDrafts`, `syncMetadata` — App state
- Database setup in `src/lib/db/index.ts`
- Migration gate in root `_layout.tsx` — app waits for `useRunMigrations()` before rendering
- Drizzle config (`drizzle.config.ts`): dialect `sqlite`, driver `expo`, output `./drizzle`
- **`babel.config.js` MUST stay** — `babel-plugin-inline-import` is required by Drizzle's SQLite migrator to import
  `.sql` migration files as strings at build time
- **NEVER create migration files manually** — always use `pnpm db:mobile:generate` from repo root

## Components

- **UI primitives:** `src/components/ui/` — **REGISTRY ONLY**. These are @rn-primitives components downloaded via shadcn
  CLI. **NEVER edit, modify, or add custom files here.** If they need updating, re-download them. If you need custom
  behavior (haptics, loading states, animations), handle it at the usage site or create a custom component in
  `src/components/`.
- **Custom components:** `src/components/` — room-card, logo, message-bubble, encryption-gate, animated-pressable,
  bottom-sheet, skeleton variants, etc. All custom components live here, NOT in `ui/`.
- Use `class-variance-authority` (`cva`) for component variants
- Use `cn()` utility for class merging
- Icons: `lucide-react-native` for custom icons, SF Symbols via `expo-symbols` for iOS system icons

## Shared Packages

- `@openhospi/shared` — Enums (companion objects), constants (`APP_NAME`, `BRAND_COLOR`), types
- `@openhospi/i18n` — Translation resources, locale config
- `@openhospi/crypto` — E2EE Signal Protocol implementation (imports `@openhospi/crypto/native` for RN-specific exports)
- `@openhospi/inacademia` — InAcademia OIDC utilities
- `@openhospi/validators` — Standalone Zod validation schemas

## Environment Variables

All client-exposed variables use `EXPO_PUBLIC_` prefix:

| Variable                   | Description                         | Default                |
| -------------------------- | ----------------------------------- | ---------------------- |
| `EXPO_PUBLIC_API_URL`      | Next.js backend URL                 | `https://openhospi.nl` |
| `EXPO_PUBLIC_SUPABASE_URL` | Supabase project URL (Realtime)     | —                      |
| `EXPO_PUBLIC_SUPABASE_KEY` | Supabase publishable key            | —                      |
| `EXPO_PUBLIC_SENTRY_DSN`   | Sentry error tracking DSN           | —                      |
| `SENTRY_AUTH_TOKEN`        | Sentry auth token (private, builds) | —                      |

Defined in `src/lib/constants.ts`. For local dev, set in `.env.local`.

## Don'ts

- **NativeWind APIs** — app uses Uniwind, not NativeWind
- **Expo API routes** — backend is Next.js (apps/web)
- **`leading-none`** — causes 1px lineHeight on RN, making text invisible
- **Dynamic classNames** — `text-${var}` won't compile; use conditionals or `style`
- **`forwardRef`** — React 19 passes ref as a prop; use `ref` prop directly
- **Manual `useMemo`/`useCallback`** — React Compiler handles memoization automatically
- **Hardcoded enum strings** — use companion objects from `@openhospi/shared/enums`
- **next-intl imports** — mobile uses react-i18next, not next-intl
- **TODO comments** — fix it now or create an issue
- **Direct Supabase data queries** — all data goes through Next.js REST API; Supabase client is Realtime-only
- **`withUniwind()` on RN/Expo components** — only for third-party components without className support
- **`as never` on route paths** — use proper typed pathnames; `as never` bypasses all route validation
- **String-interpolated dynamic routes** — ``router.push(`/room/${id}`)`` bypasses type checking; use object form with
  `pathname` + `params`
- **Editing `src/components/ui/` files** — these are @rn-primitives registry components. Never modify them. Re-download
  via shadcn CLI if they need updating. Custom components go in `src/components/`
- **`as` type assertions** — never use `as` casts. Fix the types properly or restructure the code

## Project Structure

```
src/
  @types/
    i18next.d.ts             # i18next type augmentation
  app/
    _layout.tsx              # Root: Sentry, crypto polyfill, i18n, theme, migrations, auth guard
    index.tsx                # Session check, redirect to (app), (onboarding), or (auth)
    +not-found.tsx           # 404 handler
    (auth)/
      _layout.tsx            # Stack with headerShown: false
      login.tsx              # InAcademia OIDC login
    (onboarding)/
      _layout.tsx            # Onboarding layout
      index.tsx              # Onboarding entry
      steps/                 # about, bio, identity, languages, personality, photos, security
    (app)/
      _layout.tsx            # App shell
      (tabs)/
        _layout.tsx          # NativeTabs (discover, my-rooms, chat, applications, profile)
        discover/            # Room discovery with search
        my-rooms.tsx
        chat/                # Conversation list + [conversationId]/ thread
        applications.tsx
        profile.tsx
      (modals)/              # Modal screens (edit-*, filter-sheet, apply-sheet, key-recovery)
      room/[id].tsx
      application/[id].tsx
      settings.tsx
  components/
    ui/                      # @rn-primitives REGISTRY components ONLY (button, card, text, etc.) — NEVER edit or add custom files here
    animated-pressable.tsx   # Custom: scale + haptic pressable
    bottom-sheet.tsx         # Custom: @gorhom/bottom-sheet (AppBottomSheet, AppBottomSheetModal)
    empty-state.tsx          # Custom: empty screen placeholder (icon, title, subtitle, action)
    screen-header.tsx        # Custom: standardized screen header (back, title, right action)
    skeleton.tsx             # Custom: skeleton variants using ui/skeleton.tsx as base
    room-card.tsx            # Custom: discover room card
    my-room-card.tsx         # Custom: owner room card with status badge
    message-bubble.tsx       # Custom: chat message bubble with delivery status
    conversation-list-item.tsx # Custom: chat list row with swipe + unread badge
    toast.tsx                # Custom: animated toast pill (used by ToastProvider)
    # ... and more custom components (encryption-gate, photo-carousel, etc.)
  context/
    session.tsx              # Auth + onboarding state provider
    discover-filters.tsx     # Discovery filter state (MMKV-persisted)
    toast.tsx                # Toast context provider (showToast)
  hooks/
    use-encryption.ts        # E2EE encryption/decryption context
    use-toast.ts             # useToast() hook for showing toasts
  i18n/
    index.ts                 # react-i18next + i18next-icu setup
  lib/
    animations.ts            # Reanimated spring/timing presets
    auth-client.ts           # Better Auth Expo client
    api-client.ts            # REST API wrapper
    biometric.ts             # expo-local-authentication utilities
    haptics.ts               # expo-haptics named exports
    mmkv.ts                  # react-native-mmkv instance + typed helpers
    mutation-error.ts        # createMutationErrorHandler for mutation onError
    supabase.ts              # Supabase client (Realtime only)
    constants.ts             # Environment variables, query config
    query-client.ts          # React Query config
    theme.ts                 # Navigation theme
    utils.ts                 # cn() utility
    crypto/
      secure-storage.ts      # expo-secure-store wrapper
      stores/index.ts        # SQLiteProtocolStore (Signal Protocol)
    db/
      index.ts               # Drizzle + expo-sqlite setup
      schema.ts              # 12 SQLite tables (E2EE + cache)
      migrations.ts          # useRunMigrations hook
  services/
    keys.ts                  # Query key factory
    types.ts                 # API response types
    chat.ts                  # Chat queries/mutations
    rooms.ts                 # Room queries/mutations
    profile.ts               # Profile queries/mutations
    applications.ts          # Application queries/mutations
    onboarding.ts            # Onboarding status
    invitations.ts           # Invitation queries
    settings.ts              # Settings queries/mutations
    verification.ts          # Key verification queries
```

## Taking Screenshots from the iOS Simulator

```bash
xcrun simctl list devices booted
xcrun simctl io <DEVICE-UUID> screenshot /tmp/screenshot.png
```

After saving, use the Read tool to view the image. Wait a few seconds for hot reload before taking screenshots.

## Verification

```bash
pnpm --filter @openhospi/mobile lint
pnpm --filter @openhospi/mobile typecheck
pnpm dev:mobile  # start Expo dev server
```
