# CLAUDE.md — Mobile App (`apps/mobile`)

## Stack

| Layer      | Technology                                                            |
| ---------- | --------------------------------------------------------------------- |
| Framework  | Expo SDK 55, React Native 0.83, Expo Router v4                        |
| Styling    | **Uniwind v1.5** (Tailwind CSS v4 for RN) — NOT NativeWind            |
| UI         | @rn-primitives/\* (accordion, dialog, tabs, etc.) + custom components |
| Animations | react-native-reanimated v4                                            |
| i18n       | react-i18next + i18next-icu — NOT next-intl                           |
| Auth       | Better Auth Expo client (`@better-auth/expo`)                         |
| Data       | React Query (`@tanstack/react-query`) + REST to Next.js backend       |
| Local DB   | expo-sqlite + Drizzle ORM (cache layer)                               |
| Backend    | **Next.js API** (apps/web) — NOT Expo API routes                      |
| Monitoring | Sentry (`@sentry/react-native`)                                       |
| Compiler   | React Compiler (enabled via `experiments.reactCompiler`)              |

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
- **NativeTabs** (`@react-navigation/bottom-tabs`) for the main tab bar
- Route groups: `(auth)/` for login/onboarding, `(app)/` for authenticated, `(modals)/` for modal screens
- Icons: SF Symbols via `expo-symbols` (iOS), MaterialCommunityIcons fallback (Android)
- Typed routes enabled (`experiments.typedRoutes: true`)

## Data Fetching

- **React Query** for all server state — queries, mutations, optimistic updates
- **REST API** calls to the Next.js backend (apps/web) — NOT Expo API routes
- Service layer in `src/services/` — each file exports query/mutation functions
- Query key conventions: `['entity', id]` or `['entity', 'list', filters]`

## Auth

- **Better Auth Expo** client via `@better-auth/expo`
- Token storage: `expo-secure-store`
- Login: InAcademia OIDC (SURFconext) via `expo-web-browser`
- Auth guard in root `_layout.tsx` — redirects unauthenticated users to `(auth)/login`

## i18n

- **react-i18next** with `i18next-icu` plugin — NOT next-intl (that's web-only)
- Resources loaded from `@openhospi/i18n/app` (merges `shared.json` + `app.json`)
- Use `useTranslation('translation', { keyPrefix: 'feature.section' })` pattern
- Shared labels live in `common.labels` — use `keyPrefix: 'common.labels'`
- Translation files: `packages/i18n/messages/{nl,en,de}/shared.json` and `app.json`

## Local Database (SQLite + Drizzle)

- `expo-sqlite` provides the SQLite driver
- Drizzle ORM for type-safe queries and migrations
- Schema in `src/db/`
- **`babel.config.js` MUST stay** — `babel-plugin-inline-import` is required by Drizzle's SQLite migrator to import
  `.sql` migration files as strings at build time
- Migration gate in root `_layout.tsx` — app waits for migrations before rendering
- **NEVER create migration files manually** — always use `pnpm drizzle-kit generate` to generate migrations from the schema. Migration files in `drizzle/` and `drizzle/migrations.js` are auto-generated and must not be hand-edited.

## Components

- **UI primitives:** `src/components/ui/` — exclusively for downloaded/third-party primitives (`@rn-primitives/*`). Do
  not place custom components here.
- **Custom components:** `src/components/` — room-card, logo, language-picker, input-otp, etc. All custom project
  components go here, not in `ui/`.
- Use `class-variance-authority` (`cva`) for component variants
- Use `tailwind-merge` (`cn` utility) for class merging

## Shared Packages

- `@openhospi/shared` — enums (companion objects), constants (`APP_NAME`, `BRAND_COLOR`), types
- `@openhospi/i18n` — translation resources, locale config
- `@openhospi/inacademia` — InAcademia OIDC utilities
- `@openhospi/database` — Zod validators (`createInsertSchema`), TypeScript types (`InferSelectModel`)

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

## Project Structure

```
src/
  app/
    _layout.tsx          # Root: Sentry, i18n, theme, migrations, auth guard
    index.tsx            # Session check, redirect to (app) or (auth)
    (auth)/
      _layout.tsx        # Stack with headerShown: false
      login.tsx          # Login screen
      onboarding/        # Onboarding flow (steps/)
    (app)/
      _layout.tsx        # App shell
      (tabs)/            # Tab navigator (discover, my-rooms, chat, applications, profile)
      (modals)/          # Modal screens (edit-*, filter-sheet, apply-sheet)
      room/[id].tsx      # Room detail
      application/[id].tsx
      settings.tsx
  components/
    ui/                  # Reusable UI primitives (button, card, text, separator, etc.)
    language-picker.tsx
    logo.tsx
    room-card.tsx
  db/                    # Local SQLite + Drizzle
  i18n/                  # i18next setup
  lib/                   # Auth client, constants, query client, theme, utils
  services/              # API service layer
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
