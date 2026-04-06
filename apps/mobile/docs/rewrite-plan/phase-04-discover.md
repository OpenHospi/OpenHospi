# Phase 4: Discover Tab (Flagship Screen)

> The single most important screen. Airbnb-style map + list split view.

## Summary

Rewrite the discover screen from a plain list to a map + draggable list split view. Replace Leaflet WebView map on room detail with native `expo-maps`. Add filter sheet and apply sheet with `@gorhom/bottom-sheet`.

**Server-side prerequisite**: Add `latitude`/`longitude` (with privacy offset) to the `DiscoverRoom` API type before starting this phase.

---

## Discovery Screen (`src/app/(app)/(tabs)/discover/index.tsx`) -- MAJOR REWRITE

### Architecture

```
+---------------------------+
|        Search Bar         |
|  [Filter] [City] [Price]  |  <-- filter chips
+---------------------------+
|                           |
|     expo-maps MapView     |  <-- AppleMapsView (iOS) / GoogleMapsView (Android)
|    with price markers     |
|     and privacy circles   |
|                           |
+---------------------------+
|  ======================== |  <-- @gorhom/bottom-sheet handle
|  Room Card 1   [$450/mo]  |
|  Room Card 2   [$380/mo]  |  <-- FlashList inside bottom sheet
|  Room Card 3   [$520/mo]  |
|  ...                      |
+---------------------------+
```

### Implementation Details

**Map component** (`Platform.OS` switch):

```tsx
import { AppleMaps, GoogleMaps } from 'expo-maps';

// iOS: AppleMaps.View with markers + circles
// Android: GoogleMaps.View with markers + circles
```

**Map markers**: Each room shows as a marker at its privacy-offset coordinates. Use `title` prop for price label on callout.

**Privacy circles**: For each room, render a circle overlay:

```tsx
// AppleMaps circle
{ center: { latitude, longitude }, radius: 300, color: 'rgba(59, 130, 246, 0.15)', lineColor: '#3B82F6', lineWidth: 2 }
```

**Bottom sheet**: `@gorhom/bottom-sheet` with FlashList inside.

- 3 snap points: `['15%', '50%', '90%']` (peek, half, full)
- Default snap: `'50%'` (half screen)
- `enableDynamicSizing: false`

**Map <-> list sync**:

- Scroll to a room card -> map pans to that room's marker (`setCameraPosition`)
- Tap a map marker -> list scrolls to that room card + sheet snaps to peek
- Use `onViewableItemsChanged` on FlashList to track visible rooms

**Filter chips**: Below search bar, show active filters as removable `FilterChip` components. "X" removes the filter and updates the query.

**Search bar**: Keep native `Stack.SearchBar` (already great on both platforms).

**Pre-fetching**: When FlashList renders, prefetch first 5 room details:

```tsx
queryClient.prefetchQuery({
  queryKey: queryKeys.rooms.detail(room.id),
  queryFn: () => api.get(`/api/mobile/rooms/${room.id}`),
});
```

### Camera positioning

Calculate initial camera from first batch of rooms:

```tsx
// Center on first room, zoom level 12 (city level)
const initialCamera = {
  coordinates: { latitude: rooms[0].latitude, longitude: rooms[0].longitude },
  zoom: 12,
};
```

No `fitToCoordinates` available in expo-maps. Calculate bounding box manually if needed.

---

## Filter Sheet (`src/app/(app)/(modals)/filter-sheet.tsx`) -- REWRITE

**Using**: `@gorhom/bottom-sheet` modal (not navigation modal)

### Sections

1. **City**: Multi-select chips for Dutch cities (from `City` enum)
2. **Price range**: Custom dual-thumb slider using `react-native-gesture-handler` PanGesture
3. **House type**: Single-select chips (from `HouseType` enum)
4. **Furnishing**: Single-select chips (from `Furnishing` enum)
5. **Room features**: Multi-select chips (from `RoomFeature` enum)
6. **Location tags**: Multi-select chips (from `LocationTag` enum)

### Footer

- **Apply** button with active filter count badge: "Apply (3 filters)"
- **Reset all** text button
- Haptic on apply

### State

Filters backed by `DiscoverFiltersContext` (MMKV-persisted from Phase 0F).

---

## Apply Sheet (`src/app/(app)/(modals)/apply-sheet.tsx`) -- REWRITE

- `@gorhom/bottom-sheet` presentation (replace RN Modal)
- Message input field for application cover letter
- Animated open/close
- Haptic feedback on submit
- Optimistic update: immediately show "Applied" status on the room card
- Error state with retry

---

## Room Detail (`src/app/(app)/room/[id].tsx`) -- REWRITE

### Layout (top to bottom)

1. **Photo gallery**: Full-bleed at top, `photo-carousel.tsx` with pinch-to-zoom. Page indicator dots. Shared element transition on cover photo from room card.
2. **Title + price bar**: Room title, price/month, city. Sticky on scroll (becomes header).
3. **Key details**: Compact row of badges: house type, furnishing, room size, available from.
4. **Description**: Expandable text (3 lines collapsed, tap to expand).
5. **Features**: Grid of feature chips.
6. **Location**: `expo-maps` native map with privacy circle. Replace Leaflet WebView.
7. **Housemates**: Count + "Meet your potential housemates" section.
8. **About the lister**: Profile preview card.

### Bottom bar (sticky)

- Glass effect background (`expo-glass-effect`)
- Price prominently displayed
- **Apply** button (opens apply sheet)
- **Share** button (expo-sharing)

### Animations

- Parallax scroll effect on photo gallery (photo moves slower than content)
- Sections fade-in as they scroll into view (Reanimated `useAnimatedScrollHandler`)
- Skeleton loading state while data fetches

---

## Verification Checklist

- [ ] Map renders on iOS (Apple Maps) with markers and privacy circles
- [ ] Map renders on Android (Google Maps) with markers and privacy circles
- [ ] Bottom sheet snaps to 3 positions smoothly
- [ ] Tapping a map marker scrolls the list to that room
- [ ] Scrolling the list pans the map to visible rooms
- [ ] Filter sheet opens, filters apply, filter chips show active filters
- [ ] Room detail loads with photo gallery, parallax, and native map
- [ ] Apply sheet submits application with optimistic update
- [ ] Share button triggers native share sheet
- [ ] Skeleton loading shows while data fetches
- [ ] Pre-fetching loads first 5 room details in background
- [ ] Pull-to-refresh works on the room list
