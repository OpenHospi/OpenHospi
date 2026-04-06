# Phase 5: Chat Tab

> WhatsApp/Signal quality E2EE messaging. Clean, fast, reliable.

## Summary

Rewrite conversation list with FlashList + swipe gestures. Rewrite message thread with delivery status, animations, and context menus. Polish key verification flow.

**Keep untouched**: `src/hooks/use-encryption.ts`, `src/lib/crypto/**`, `src/lib/db/**` -- the E2EE protocol layer works correctly.

---

## Conversation List (`src/app/(app)/(tabs)/chat/index.tsx`) -- REWRITE

### Layout

- Native `Stack.SearchBar` for filtering conversations
- `FlashList` with `estimatedItemSize={76}` (avatar height + padding)
- Each row: `conversation-list-item.tsx` (rewritten in Phase 0E)

### Features

- **Swipe-to-archive**: Left swipe reveals archive action (via `swipeable-row.tsx`)
- **Avatar**: Profile photo with E2EE lock icon overlay (small green lock badge)
- **Last message preview**: Truncated to 1 line, with delivery status icon
- **Relative timestamps**: "2m ago", "Yesterday", "Mon" (use `date-fns` or manual)
- **Unread badge**: Animated spring badge with count (via `notification-badge.tsx`)
- **Pull-to-refresh**: `pull-to-refresh.tsx` component
- **Skeleton loading**: 5 conversation row skeletons while loading
- **Empty state**: "No conversations yet" with illustration

### Data

- Uses `useConversations()` from `src/services/chat.ts`
- Prefetch conversation details for first 3 conversations

---

## Message Thread (`src/app/(app)/(tabs)/chat/[conversationId]/index.tsx`) -- REWRITE

This is the second most complex screen (after discovery). The E2EE logic stays, the UI gets overhauled.

### Layout

```
+---------------------------+
| < Back   Chat Name   ...  |  <-- Header with member name + E2EE banner
+---------------------------+
|  [E2EE] Messages are      |
|  end-to-end encrypted      |  <-- Tap to verify keys
+---------------------------+
|                            |
|  [date separator: Today]   |
|                            |
|        Message bubble  [✓] |  <-- Right-aligned (sent)
|  [✓✓] Message bubble       |  <-- Left-aligned (received)
|                            |
|        Message bubble  [⏱] |  <-- Clock = sending
|                            |
+---------------------------+
| [+] Type a message...  [>] |  <-- chat-input-bar.tsx
+---------------------------+
```

### Implementation

**List**: `FlashList` with `inverted: true` for bottom-anchored scrolling. `estimatedItemSize={60}`.

**Message bubbles** (`message-bubble.tsx` from Phase 0E):

- Sent: right-aligned, brand color background
- Received: left-aligned, muted background
- Reanimated entering animation: `SlideInUp.duration(150)` + `FadeIn`
- Delivery status icons per message:
  - Clock icon = sending (queued/in-flight)
  - Single check = sent to server
  - Double check = delivered to recipient
- Long-press: context menu (Copy, Delete)
- Failed message: red exclamation with "Tap to retry"

**E2EE banner**: Subtle bar at top: "Messages are end-to-end encrypted. Tap to verify."

- Tap navigates to key verification screen
- Green if verified, gray if unverified

**Keyboard handling**: `KeyboardAvoidingView` with `behavior="padding"` (iOS) / `"height"` (Android). Chat input bar animates smoothly with keyboard.

**Scroll-to-bottom FAB**: Appears when scrolled up. Shows unread count badge. Tap scrolls to latest message with spring animation.

**Date separators**: "Today", "Yesterday", "March 15" between messages from different days.

**Haptic**: `hapticLight()` on message send.

**Realtime**: Keep existing Supabase Broadcast subscription per `chat:${conversationId}` channel. On new message event: decrypt, insert into FlashList via optimistic update.

---

## Conversation Info (`src/app/(app)/(tabs)/chat/[conversationId]/info.tsx`) -- REWRITE

- Room info card at top (which room this conversation is about)
- Member list with avatars
- E2EE status per member:
  - Green shield = keys verified
  - Yellow shield = unverified
- "Verify keys" button per member -> navigates to verification screen
- "Block user" action (existing functionality, better UI)
- "Report" action

---

## Key Verification (`src/app/(app)/(tabs)/chat/[conversationId]/verify/[userId].tsx`) -- REWRITE

### Flow

1. Show safety number (fingerprint) as text + QR code
2. Two options: scan QR code or compare numbers manually
3. QR scanner (using `expo-camera`)
4. On match: success animation (green checkmark with spring scale), haptic success
5. On mismatch: error animation (red X with shake), haptic error
6. Verified status persists locally in SQLite `key_verifications` table

### UI

- Large QR code display (scannable by other device)
- Safety number displayed as groups of 5 digits
- Scan button opens camera
- Manual verify: "I've verified the numbers match" button
- Success/error animations using Reanimated

---

## Verification Checklist

- [ ] Conversation list loads with FlashList (no FlatList)
- [ ] Swipe-to-archive gesture works smoothly
- [ ] Unread badge animates on count change
- [ ] Messages encrypt/decrypt correctly (E2EE regression test)
- [ ] Delivery status icons update: clock -> check -> double-check
- [ ] Long-press context menu appears on messages
- [ ] Failed message shows retry UI
- [ ] Keyboard animation is smooth (no jumping)
- [ ] Scroll-to-bottom FAB appears when scrolled up
- [ ] Realtime messages appear instantly via Supabase Broadcast
- [ ] Pull-to-refresh works
- [ ] Key verification QR scan works
- [ ] Verification success/error animations play
- [ ] Haptic feedback on message send
