# Phase 3: Navigation Shell

> Configure the app shell: layouts, tab bar, deep links, transitions.

## Summary

Enhance tab bar with badges and haptics, configure modal presentation styles, and set up deep link handling. (`GestureHandlerRootView`, `BottomSheetModalProvider`, and `ToastProvider` are already wired in Phase 2.)

---

## Files to Modify

### `src/app/_layout.tsx` (NO CHANGES in Phase 3)

Already updated in Phase 2 with `GestureHandlerRootView`, `BottomSheetModalProvider`, and `ToastProvider`. MMKV is
initialized via `src/lib/mmkv.ts` (also Phase 2). No further changes needed here.

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

## Navigation Rules

### Max modal depth: 1

Maximum 1 modal at a time. No modal stacking. If a user action inside a modal needs to navigate somewhere, dismiss the modal first, then navigate. This prevents unpredictable back-button behavior and keeps the app simple.

### Notification tap routing

Each notification type maps to a specific screen. Implement in `src/lib/notifications.ts`:

| Notification Type    | Route To                                 | Params           |
| -------------------- | ---------------------------------------- | ---------------- |
| `new_message`        | `/(app)/(tabs)/chat/[conversationId]`    | `conversationId` |
| `new_applicant`      | `/(app)/(tabs)/my-rooms/[id]/applicants` | `id` (roomId)    |
| `application_update` | `/(app)/application/[id]`                | `id`             |
| `event_invitation`   | `/(app)/application/[id]`                | `id`             |
| `event_reminder`     | `/(app)/application/[id]`                | `id`             |
| `room_update`        | `/(app)/room/[id]`                       | `id`             |
| Default              | `/(app)/(tabs)/profile`                  | none             |

Use shared notification type enums from `@openhospi/shared` (not hardcoded strings).

### URL deep link handling

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

---

## Verification Checklist

- [ ] Tab badges show correct unread counts
- [ ] Haptic fires on tab press (test on real device)
- [ ] Modal screens present as `formSheet` on iOS
- [ ] Swipe-to-dismiss works on modal screens
- [ ] Deep link `openhospi://chat/123` navigates to correct chat
- [ ] Deep link from notification tap works for ALL notification types
- [ ] No modal stacking possible (opening a modal from a modal dismisses the first)
- [ ] URL scheme `openhospi://` handles all supported paths
- [ ] Universal link `https://openhospi.nl/room/abc` opens room detail
