# Phase 3: Navigation Shell

> Configure the app shell: layouts, tab bar, deep links, transitions.

## Summary

Wire up new providers (`BottomSheetModalProvider`), enhance tab bar with badges and haptics, configure modal presentation styles, and set up deep link handling.

---

## Files to Modify

### `src/app/_layout.tsx` (KEEP, minor additions)

- Add `BottomSheetModalProvider` from `@gorhom/bottom-sheet` inside the existing `GestureHandlerRootView`
- Add MMKV initialization (import `storage` from `src/lib/mmkv.ts` to ensure it's created early)
- Keep everything else: Sentry, crypto polyfill, i18n, theme, RQ provider, session, migrations

```tsx
// Provider nesting order (existing + new):
<GestureHandlerRootView>
  <BottomSheetModalProvider>
    {' '}
    {/* NEW */}
    <QueryClientProvider>
      <SessionProvider>
        <Stack>...</Stack>
      </SessionProvider>
    </QueryClientProvider>
  </BottomSheetModalProvider>
</GestureHandlerRootView>
```

### `src/app/(app)/_layout.tsx` (REWRITE)

- Keep `DiscoverFiltersProvider` wrapping
- Keep `ConnectionStatusBar`
- Add deep link handling: listen for `expo-linking` URL events, parse and navigate
- Configure stack screen transitions:
  - Default: native push animation
  - Modals: `presentation: 'modal'` with `formSheet` style on iOS
  - Fade: for tab-to-detail transitions

### `src/app/(app)/(tabs)/_layout.tsx` (ENHANCE)

Current state: NativeTabs with 5 tabs and basic badge counts. Enhance:

- Add notification badge count on **Chat** tab (unread conversations)
- Add notification badge count on **Applications** tab (pending actions)
- Add haptic feedback on tab press via `tabBarListeners`:
  ```tsx
  listeners={{
    tabPress: () => hapticSelection(),
  }}
  ```
- Pre-fetch data for adjacent tabs on initial load:
  ```tsx
  // When discover tab mounts, prefetch chat conversations and profile
  useEffect(() => {
    queryClient.prefetchQuery({ queryKey: queryKeys.chat.conversations() });
    queryClient.prefetchQuery({ queryKey: queryKeys.profile.me() });
  }, []);
  ```

### `src/app/(app)/(modals)/_layout.tsx` (REWRITE)

- Configure modal presentation: `presentation: 'modal'` with iOS `formSheet` style
- Enable swipe-to-dismiss gesture handling
- Set transparent background for overlay effect

---

## Deep Link Configuration

### URL scheme

Verify `app.config.ts` has:

```typescript
scheme: 'openhospi',
// iOS
ios: {
  associatedDomains: ['applinks:openhospi.nl'],
},
// Android
android: {
  intentFilters: [{
    action: 'VIEW',
    data: [{ scheme: 'https', host: 'openhospi.nl', pathPrefix: '/room/' }],
    category: ['BROWSABLE', 'DEFAULT'],
  }],
},
```

### Supported deep links

| URL                                 | Screen                       | Params           |
| ----------------------------------- | ---------------------------- | ---------------- |
| `openhospi://chat/{conversationId}` | Chat thread                  | `conversationId` |
| `openhospi://room/{id}`             | Room detail                  | `id`             |
| `openhospi://application/{id}`      | Application detail           | `id`             |
| `openhospi://join/{code}`           | Join house                   | `code`           |
| `https://openhospi.nl/room/{code}`  | Room detail (universal link) | `code`           |

---

## Verification Checklist

- [ ] `BottomSheetModalProvider` wraps correctly (test by opening a bottom sheet)
- [ ] Tab badges show correct unread counts
- [ ] Haptic fires on tab press (test on real device)
- [ ] Modal screens present as `formSheet` on iOS
- [ ] Swipe-to-dismiss works on modal screens
- [ ] Deep link `openhospi://chat/123` navigates to correct chat
- [ ] Deep link from notification tap works
