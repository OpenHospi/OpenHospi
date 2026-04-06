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

## Key Verification -- BOTTOM SHEET (not full-screen navigation)

**Changed from plan**: Key verification now opens as a `@gorhom/bottom-sheet` from the E2EE banner in the chat thread. This reduces verification from 3 taps to 1 tap. The file `verify/[userId].tsx` is still used for the full QR scanner, but the initial verification UI is a bottom sheet.

### Flow

1. User taps E2EE banner "Tap to verify" in chat thread
2. Bottom sheet opens with: safety number (groups of 5 digits) + "Scan QR Code" button + "I've verified" button
3. "Scan QR Code" -> navigates to `verify/[userId].tsx` (full-screen camera)
4. "I've verified" -> marks as verified immediately (trust-on-first-use with manual confirm)
5. On match: success animation (green checkmark with spring scale), haptic success
6. On mismatch: error animation (red X with shake), haptic error
7. Verified status persists locally in SQLite `key_verifications` table

### UI

- Large QR code display (scannable by other device)
- Safety number displayed as groups of 5 digits
- Scan button opens camera
- Manual verify: "I've verified the numbers match" button
- Success/error animations using Reanimated

---

## UX Requirements (all screens in this phase)

### Skeleton loading

- **Conversation list initial load**: 5 `SkeletonConversation` rows (circle + 2 text lines)
- **Message thread initial load**: 4 message bubble skeletons (alternating left/right alignment)
- **Conversation info**: Avatar skeleton + 2 member row skeletons
- **Key verification**: No skeleton needed (instant local data)

### Error handling

- **Conversation list fetch fails**: "Couldn't load conversations. Check your connection." + retry
- **Messages fetch fails**: "Couldn't load messages." + retry button
- **Message send fails (network)**: Red bubble with "Couldn't send. Tap to retry." (not generic alert)
- **Message decrypt fails**: Show "[Message couldn't be decrypted]" in gray italic (not crash)
- **Key distribution fails**: "Encryption setup failed. Messages may not deliver." + retry
- **Archive success**: Show "Conversation archived" toast with "Undo" button (5 seconds, like Gmail). Undo restores the conversation.
- **Archive fails**: Silent retry, show error toast "Couldn't archive"

### Empty states

- **No conversations**: "No conversations yet. Apply to a room to start chatting!" + CTA to discover tab
- **No messages in thread**: "Say hello! This is the start of your conversation." (inline, not empty state)
- **No search results**: "No conversations matching '[query]'"

### Animations

- Conversation rows: `FadeIn.duration(150)` staggered entering
- Message bubbles: `SlideInUp.duration(150)` + `FadeIn` on new messages
- Unread badge: spring scale animation on count change
- Swipe-to-archive: smooth horizontal pan with reveal
- Scroll-to-bottom FAB: spring appear/disappear
- Key verification success: green checkmark spring scale

### Haptic feedback

- Message send: `hapticLight()`
- Message send success: `hapticSuccess()` (subtle, when server confirms)
- Message send failure: `hapticError()`
- Swipe-to-archive: `hapticMedium()` on threshold
- Long-press context menu: `hapticMedium()`
- Copy message: `hapticSelection()`
- Pull-to-refresh trigger: `hapticLight()`
- Key verification success: `hapticSuccess()`
- Key verification failure: `hapticError()`

### Accessibility

- Conversation rows: `accessibilityLabel="Conversation with [name], last message: [preview], [time]"`
- Message bubbles: `accessibilityLabel="[sender] said: [message text], [time], [status]"`
- Delivery status icons: `accessibilityLabel="Sending"` / `"Sent"` / `"Delivered"` (not icon-only)
- E2EE banner: `accessibilityLabel="Messages are encrypted. Tap to verify keys."`
- Send button: `accessibilityLabel="Send message"`
- Archive action: `accessibilityLabel="Archive conversation"`
- All touch targets minimum 44pt (especially send button, FAB)

### Pull-to-refresh

- Conversation list: yes
- Message thread: no (use scroll-to-top to load older, not pull-to-refresh)

---

## Verification Checklist

- [ ] Conversation list loads with FlashList and skeleton (not spinner)
- [ ] Message thread loads with skeleton (not spinner)
- [ ] Swipe-to-archive gesture works with haptic
- [ ] Unread badge animates on count change
- [ ] Messages encrypt/decrypt correctly (E2EE regression test)
- [ ] Delivery status icons update: clock -> check -> double-check
- [ ] Failed message shows "Tap to retry" (not generic alert)
- [ ] Decrypt failure shows gray italic placeholder (not crash)
- [ ] Long-press context menu with haptic
- [ ] Keyboard animation is smooth
- [ ] Scroll-to-bottom FAB appears when scrolled up
- [ ] Realtime messages animate in via Supabase Broadcast
- [ ] Empty state with CTA when no conversations
- [ ] All icon buttons have accessibilityLabel
- [ ] All touch targets minimum 44pt
- [ ] Pull-to-refresh works on conversation list
- [ ] Key verification success/error with haptic
