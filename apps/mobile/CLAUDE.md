# CLAUDE.md — Mobile App (`apps/mobile`)

## Stack

- **Framework:** Expo SDK 55+, React Native 0.83, Expo Router
- **Styling:** Uniwind v1.5+ (Tailwind CSS v4 for React Native) + react-native-reanimated v4
- **i18n:** react-i18next with `@openhospi/i18n/app` (merges shared + app translations)
- **Auth:** Better Auth Expo client
- **Local DB:** SQLite via Drizzle ORM (cache layer)
- **State:** React Query (`@tanstack/react-query`)

## Critical: Styling Rules for React Native + Uniwind

### Use `style` for layout, `className` for visuals

Uniwind's `className` does NOT reliably handle layout properties on all components. Always split:

```tsx
// CORRECT — style for layout, className for visuals
<View
  style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24 }}
  className="bg-background"
>

// WRONG — className for layout breaks on SafeAreaView, Animated.View, etc.
<View className="flex-1 items-center justify-center px-6 bg-background">
```

**Use `style` for:** `flex`, `flexDirection`, `justifyContent`, `alignItems`, `gap`, `padding*`, `margin*`, `width`, `height`, `maxWidth`, `position`, `top/right/bottom/left`

**Use `className` for:** colors (`bg-*`, `text-*`, `border-*`), typography (`text-xl`, `font-semibold`, `tracking-tight`), borders (`rounded-xl`, `border`), shadows (`shadow-sm`), opacity

### Avoid `leading-none` on React Native Text

Tailwind's `leading-none` = `lineHeight: 1`. On web this is a multiplier (1×). On React Native this is **1 pixel**, making text invisible. Use explicit values like `leading-7` instead.

### Don't rely on Card component's TextClassContext for text color

The shadcn Card component wraps children in `TextClassContext.Provider value="text-card-foreground"`. This context-based color propagation is unreliable in Uniwind — text can render invisible.

**Instead:** Build card-like containers with plain `View` + explicit styles, or always add explicit text color classes (`text-foreground`, `text-muted-foreground`) on every `Text` component inside cards.

```tsx
// CORRECT — plain View as card, explicit text colors
<View style={{ width: '100%' }} className="bg-card border-border rounded-xl border py-6">
  <View style={{ alignItems: 'center', gap: 6, paddingHorizontal: 24 }}>
    <Text className="text-foreground text-2xl font-semibold">{title}</Text>
    <Text className="text-muted-foreground text-center text-sm">{description}</Text>
  </View>
</View>

// RISKY — Card + CardTitle with invisible text due to leading-none + TextClassContext
<Card>
  <CardHeader>
    <CardTitle>{title}</CardTitle>
  </CardHeader>
</Card>
```

### `className` works on Animated.View

`Animated.View` from react-native-reanimated supports `className` directly — no `withUniwind()` wrapper needed. But still prefer `style` for layout properties.

```tsx
<Animated.View
  entering={FadeInDown.duration(500).springify()}
  style={{ width: '100%', maxWidth: 448, alignItems: 'center' }}
  className="bg-card rounded-xl">
```

## Project Structure

```
src/
  app/
    _layout.tsx          # Root: Sentry, i18n, theme, migrations, auth guard
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

## i18n

- Uses `react-i18next` (NOT next-intl like web)
- Namespace: `'translation'` with `keyPrefix` per feature
- Resources from `@openhospi/i18n/app` (merges `shared.json` + `app.json`)
- Keys live in `packages/i18n/messages/{nl,en,de}/shared.json` under `auth.login`, etc.

## Taking Screenshots from the iOS Simulator

Use `xcrun simctl` to capture screenshots for visual verification:

```bash
# List booted simulators to find the device UUID
xcrun simctl list devices booted

# Take a screenshot (replace UUID with the booted device)
xcrun simctl io <DEVICE-UUID> screenshot /tmp/screenshot.png
```

After saving, use the Read tool to view the image — Claude Code is multimodal and can analyze screenshots directly.

Note: after code changes, wait a few seconds for hot reload before taking the screenshot. If the UI doesn't update, the user may need to manually reload the app (Cmd+D → Reload in simulator).

## Verification

```bash
pnpm --filter @openhospi/mobile lint
pnpm --filter @openhospi/mobile typecheck
pnpm dev:mobile  # start Expo dev server
```
