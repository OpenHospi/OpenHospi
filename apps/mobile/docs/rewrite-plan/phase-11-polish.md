# Phase 11: Performance Polish

> Offline-first, pre-fetching, image caching, skeleton screens. The final quality layer.

## Summary

Cross-cutting performance optimizations that make the app feel instant and work offline. This phase touches multiple screens but doesn't rewrite any -- it adds polish on top.

---

## 1. Offline Mutation Queue

### Extend React Query offline persistence

Currently only `sendMessage` is persisted. Add:

| Mutation               | Why                                                          |
| ---------------------- | ------------------------------------------------------------ |
| `applyToRoom`          | User applies while on subway, shouldn't lose the application |
| `updateProfile`        | Profile edits should queue, not fail silently                |
| `uploadProfilePhoto`   | Large binary, important to retry                             |
| `uploadRoomPhoto`      | Large binary, important to retry                             |
| `markConversationRead` | Read status should sync when back online                     |

### Offline feedback

When a mutation is queued offline, show a toast:

```
"Saved offline. Will sync when you're back online."
```

Use `connection-status-bar.tsx` (rewritten in Phase 2) to show persistent offline indicator at top of screen.

When mutations sync on reconnect, show brief success toast:

```
"Synced 3 pending changes."
```

---

## 2. Pre-fetching Strategy

### Discovery tab

When room list renders, prefetch first 5 room details in background:

```typescript
const onViewableItemsChanged = useCallback(({ viewableItems }) => {
  viewableItems.slice(0, 5).forEach((item) => {
    queryClient.prefetchQuery({
      queryKey: queryKeys.rooms.detail(item.item.id),
      queryFn: () => api.get(`/api/mobile/rooms/${item.item.id}`),
      staleTime: QUERY_STALE_TIMES.rooms,
    });
  });
}, []);
```

### Chat tab

When conversation list renders, prefetch first 3 conversation details:

```typescript
conversations.slice(0, 3).forEach((conv) => {
  queryClient.prefetchQuery({
    queryKey: queryKeys.chat.conversationDetail(conv.id),
  });
});
```

### Profile

Prefetch user profile on app launch (background, non-blocking):

```typescript
// In root _layout.tsx, after session is confirmed:
queryClient.prefetchQuery({ queryKey: queryKeys.profile.me() });
```

### My Rooms

Prefetch first room's detail when my-rooms list renders.

---

## 3. Image Caching

### `CachedImage` component (created in Phase 2)

Ensure all images across the app use `CachedImage` instead of raw `expo-image` or `Image`:

```typescript
// CachedImage defaults:
cachePolicy: 'disk',        // Persist across app restarts
transition: 200,             // 200ms crossfade on load
recyclingKey: item.id,       // For FlashList cell recycling
placeholder: { color: '#f0f0f0' },  // Muted gray placeholder
```

### Integration points

- Room cards (cover photo)
- Room detail (photo gallery)
- Profile photos (carousel + avatars)
- Conversation list (avatars)
- Applicant cards (avatars)
- Onboarding (photo preview)

### Memory management

For FlashList with many images, use `recyclingKey` to prevent memory leaks:

```tsx
<CachedImage
  source={{ uri: room.coverPhotoUrl }}
  recyclingKey={room.id} // Reuse image view when cell is recycled
  style={{ width: '100%', height: 200 }}
/>
```

---

## 4. Skeleton Screens

Every screen shows a skeleton loading state (not a spinner). Created in Phase 2, integrated here.

### Skeleton variants and where they're used

| Variant                    | Used in          | Appearance                                          |
| -------------------------- | ---------------- | --------------------------------------------------- |
| `SkeletonDiscoverList`     | Discover tab     | Map placeholder (gray rect) + 3 room card skeletons |
| `SkeletonConversationList` | Chat tab         | 5 conversation row skeletons (circle + 2 lines)     |
| `SkeletonRoomDetail`       | Room detail      | Photo placeholder + title bar + 4 text lines        |
| `SkeletonProfile`          | Profile tab      | Large circle (avatar) + 3 section card skeletons    |
| `SkeletonApplicationList`  | Applications tab | 3 application card skeletons                        |
| `SkeletonMyRoomsList`      | My Rooms tab     | 2 room card skeletons                               |

### Implementation pattern

```tsx
function DiscoverScreen() {
  const { data, isLoading } = useRooms(filters);

  if (isLoading) return <SkeletonDiscoverList />;

  return <ActualDiscoverContent data={data} />;
}
```

### Shimmer animation

The existing `skeleton.tsx` already has shimmer animation. Ensure all variants use it consistently with the same timing (1.5s loop).

---

## 5. Performance Monitoring

### React DevTools Profiler

After completing all phases, profile key screens:

- Discovery tab: ensure 60fps during list scroll and map interaction
- Chat thread: ensure 60fps during message list scroll
- Room creation wizard: ensure smooth step transitions

### Flipper (optional)

If performance issues found, use Flipper to:

- Inspect network requests (verify deduplication working)
- Check React component re-renders
- Monitor memory usage

### Reanimated performance

If layout animations cause jank on low-end devices:

```typescript
// Conditionally disable animations
const ENABLE_ANIMATIONS = !isLowEndDevice();

const entering = ENABLE_ANIMATIONS ? FadeIn.duration(200) : undefined;
```

---

## Verification Checklist

- [ ] Airplane mode: cached rooms display from React Query persister
- [ ] Airplane mode: "Apply to Room" queues and shows offline toast
- [ ] Reconnect: queued mutations sync and show success toast
- [ ] Pre-fetch: tapping a room card shows instant content (no loading)
- [ ] Pre-fetch: tapping a conversation shows instant header (no loading)
- [ ] All images use `CachedImage` (grep for raw `Image` or `expo-image` usage)
- [ ] Skeleton screens show on every screen during initial load
- [ ] No spinners anywhere (skeletons only)
- [ ] 60fps on room list scroll (FlashList profiler)
- [ ] 60fps on chat message scroll (FlashList profiler)
- [ ] Memory stays stable during long chat scroll (no leaks)
- [ ] App starts and shows content within 2 seconds on mid-range device
