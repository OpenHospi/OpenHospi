# Phase 4: Discover Tab (Flagship Screen)

> The single most important screen. Full-bleed photo cards with native search.

## Summary

Rewrite the discover screen as an immersive **full-bleed photo card feed** with native search and a **map FAB** for spatial browsing. Replace Leaflet WebView map on room detail with native `expo-maps`. Add filter sheet and apply sheet with `@gorhom/bottom-sheet`.

**Server-side prerequisite**: Add `latitude`/`longitude` (with privacy offset) to the `DiscoverRoom` API type before starting this phase.

---

## Discovery Screen (`src/app/(app)/(tabs)/discover/index.tsx`) -- MAJOR REWRITE

### Layout

```
+-----------------------------+
|  LogoText              [ ⫏ ]|  <-- header: logo title + filter toolbar button
|  [ Native Search Bar      ] |  <-- Stack.SearchBar (native iOS/Android)
+-----------------------------+
|  [Amsterdam] [<600] [Furn.] |  <-- active filter chips (only when filters active)
+-----------------------------+
|                             |
| +-------------------------+ |
| |                         | |
| |                         | |
| |     Large Room Photo    | |  <-- full-bleed photo, ~60% of card height
| |                         | |
| |                   €450  | |  <-- price badge overlay (bottom-right)
| +-------------------------+ |
| | Cozy room in De Pijp    | |  <-- title (bold)
| | Amsterdam · 45m² · Furn.| |  <-- city + details (muted)
| +-------------------------+ |
|                             |
| +-------------------------+ |
| |                         | |
| |     Next Room Photo     | |
| |                   €380  | |
| +-------------------------+ |
| | Bright studio near VU   | |
| | Amsterdam · 28m²        | |
| +-------------------------+ |
|                             |
|                   [ Map 🗺 ]|  <-- FAB bottom-right (toggles to map view)
+-----------------------------+
```

### Header (keep existing native patterns)

Keep the existing header as-is -- it already works great on both platforms:

- **`Stack.SearchBar`** -- native search bar in the navigation header
- **`Stack.Toolbar placement="right"`** + **`Stack.Toolbar.Button`** -- filter icon, navigates to filter-sheet modal
- **`LogoText`** in `headerTitle`

### Card Feed (new)

- Replace `FlatList` with **FlashList** of **full-bleed photo cards**
- Each card:
  - **Cover photo**: full card width, ~60% of card height (~220px), rounded top corners
  - **Price badge**: overlay in bottom-right of photo (semi-transparent background, white text, bold)
  - **Share icon**: small share button overlay in top-right of photo (1 tap to share room from feed, like Instagram)
  - **Title**: bold, below photo
  - **Details line**: city + room size + furnishing status (muted text)
  - Card: `rounded-xl`, subtle shadow (`shadow-sm`), `bg-card`
- `CachedImage` for cover photos with disk caching + placeholder
- `FadeIn.duration(200)` entering animation, staggered by index
- Haptic on card press (`hapticLight()`)
- Tap card -> navigate to room detail
- Infinite scroll with pagination
- Pull-to-refresh
- **Active filter chips**: horizontal scrollable row between header and cards (only visible when filters are active, collapses when no filters)

### Map FAB (new)

- Floating action button in bottom-right corner (above tab bar)
- Map icon, brand color, circular, subtle shadow
- Tap -> toggles to full-screen map view
- `hapticLight()` on press
- Animated appear (spring scale-in on mount)

### Map View (toggled via FAB)

When map FAB is tapped:

```
+-----------------------------+
|  LogoText              [ ⫏ ]|  <-- same header
|  [ Native Search Bar      ] |
+-----------------------------+
|                             |
|                             |
|      expo-maps MapView      |  <-- full screen map
|     with price markers      |
|     and privacy circles     |
|                             |
|                             |
+-----------------------------+
|  +-----------------------+  |  <-- bottom sheet (peek) when marker tapped
|  | Room Card preview     |  |
|  +-----------------------+  |
|                  [ List 📋 ]|  <-- FAB changes to list icon
+-----------------------------+
```

- `expo-maps` (`AppleMapsView` on iOS, `GoogleMapsView` on Android) fills the screen
- Markers at privacy-offset coordinates with price in callout title
- Privacy circles (300m radius, semi-transparent blue)
- Tap marker -> `@gorhom/bottom-sheet` peeks up with compact `RoomMapCard` preview
- Tap room card preview -> navigate to room detail
- FAB changes to list icon (tap returns to card feed)
- Remember last-used mode in MMKV
- Smooth crossfade transition between modes
- Both modes share same filter state and query data

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

**Map room preview**: When a marker is tapped, show a `RoomMapCard` (compact room card) in a small bottom sheet at the bottom. Not a full draggable list -- just the selected room.

**Filter chips**: Below search bar in both modes. Show active filters as removable `FilterChip` components. "X" removes the filter and updates the query.

**Search bar**: Keep native `Stack.SearchBar` (already great on both platforms).

**Pre-fetching**: When FlashList renders (list mode), prefetch first 5 room details:

```tsx
queryClient.prefetchQuery({
  queryKey: queryKeys.rooms.detail(room.id),
  queryFn: () => api.get(`/api/mobile/rooms/${room.id}`),
});
```

### Camera positioning (map mode)

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

1. **City**: Searchable dropdown populated dynamically from rooms in the database (`useAvailableCities()` hook -- returns `SELECT DISTINCT city FROM rooms WHERE status = 'available'`). No hardcoded list.
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

1. **Photo gallery**: Full-bleed at top, `photo-carousel.tsx` with pinch-to-zoom. Page indicator dots. Shared element transition on cover photo from room card. **Share icon overlay** in top-right corner of photo (1 tap to share from detail).
2. **Title + price bar**: Room title, price/month, city. Sticky on scroll (becomes header).
3. **Key details**: Compact row of badges: house type, furnishing, room size, available from.
4. **Description**: 3 lines collapsed + "Read more" to expand. Progressive disclosure.
5. **Features**: Show top 4 feature chips. "Show all features" expands the rest. Collapsible to save scroll space.
6. **Location**: `expo-maps` native map with privacy circle. Replace Leaflet WebView.
7. **Your potential housemates**: Merged section -- housemate count + lister profile preview card in one section. Reduces from 8 sections to 7.

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

## UX Requirements (all screens in this phase)

### Skeleton loading (no spinners)

- **Discovery screen initial load**: Map placeholder (gray rect) + 3 `SkeletonRoomCard` in bottom sheet
- **Room detail**: Photo placeholder + title bar + 4 text line skeletons
- **Filter sheet**: No skeleton needed (opens instantly, no data fetch)
- **Apply sheet**: No skeleton needed (form, no data fetch)

### Error handling (specific, not generic)

- **Room list fetch fails**: "Couldn't load rooms. Check your connection." + retry button in empty area
- **Room detail fetch fails**: "Room not found or unavailable." + back button
- **Apply fails (network)**: "Couldn't send application. You're offline." + "Retry" button
- **Apply fails (already applied)**: "You've already applied to this room."
- **Apply fails (room closed)**: "This room is no longer accepting applications."
- **Filter apply fails**: Silently retry, show stale cached results with "Results may be outdated" banner

### Empty states with CTAs

- **No rooms match filters**: "No rooms found" + "Clear filters" button + "Broaden your search" suggestion
- **No rooms at all**: "No rooms available yet. Check back soon!" (unlikely but handle it)
- **No search results**: "No results for '[query]'" + "Clear search" button

### Animations

- Room cards: `FadeIn.duration(200)` entering animation, staggered by index
- Bottom sheet: spring animation on snap transitions
- Filter chips: scale-in when added, scale-out when removed
- Room detail sections: fade-in as they scroll into view
- Apply success: checkmark scale animation + haptic success

### Haptic feedback

- Tab on map marker: `hapticSelection()`
- Tap on room card: `hapticLight()`
- Apply button press: `hapticLight()`
- Apply success: `hapticSuccess()`
- Apply error: `hapticError()`
- Filter apply: `hapticLight()`
- Filter reset: `hapticSelection()`
- Pull-to-refresh trigger: `hapticLight()`

### Accessibility

- Map markers: `accessibilityLabel="Room at [price] per month in [city]"`
- Room cards: `accessibilityRole="button"`, `accessibilityLabel="[title], [price] per month, [city]"`
- Filter button: `accessibilityLabel="Open filters"` (not icon-only)
- Search bar: `accessibilityLabel="Search rooms"`
- Price text: include "per month" in label (not just the number)
- All touch targets minimum 44pt
- Photo gallery: `accessibilityLabel="Room photo [n] of [total]"`

### Pull-to-refresh

- Discovery room list: yes (refreshes both map pins and list)
- Room detail: yes (refreshes room data)

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
- [ ] Skeleton loading shows on initial load (not spinner)
- [ ] Specific error messages show for each failure type
- [ ] Empty state with CTA shows when no rooms match
- [ ] Room cards animate in with staggered FadeIn
- [ ] Haptic fires on every interactive element
- [ ] All icon buttons have accessibilityLabel
- [ ] All touch targets are minimum 44pt
- [ ] Pre-fetching loads first 5 room details in background
- [ ] Pull-to-refresh works on the room list
