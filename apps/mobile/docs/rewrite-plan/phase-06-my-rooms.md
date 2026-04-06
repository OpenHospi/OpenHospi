# Phase 6: My Rooms Tab

> Room management for room listers: create, edit, review applicants, events, voting.

## Summary

Rewrite all 18 screens in the My Rooms tab. This is the largest tab with the most screens: room list, 6-step creation wizard, room detail/edit, applicant management, events, voting, and room closing.

---

## My Rooms List (`src/app/(app)/(tabs)/my-rooms/index.tsx`) -- REWRITE

- `FlashList` of `my-room-card.tsx` (rewritten in Phase 0E)
- Status badges with color coding:
  - Green: published/available
  - Yellow: draft
  - Gray: closed/filled
- FAB or header button "Create Room" -> navigates to creation wizard
- Pull-to-refresh
- Empty state: "You haven't listed any rooms yet" with CTA to create
- Swipe actions on draft cards (edit, delete)

---

## Room Creation Wizard (6 screens in `my-rooms/create/`)

All screens share: `step-indicator.tsx` at top, smooth horizontal transitions, form validation via `react-hook-form` + `@openhospi/validators`, progress auto-saved to MMKV.

### `house-gate.tsx` -- Step 0

- If user has a house: select it from list
- If no house: create one (name + invite code generated)
- Uses `useOwnerHouses()` query

### `basic-info.tsx` -- Step 1

- Title (text input, required)
- City (select from `City` enum chips)
- **Address autocomplete** (same approach as web): type address, PDOK Dutch government API returns suggestions, select one to auto-fill street, house number, postal code, and lat/lng coordinates
  - Uses `PDOK_SUGGEST_URL` and `PDOK_LOOKUP_URL` from `@openhospi/shared/constants` (already shared)
  - Create a React Native `AddressAutocomplete` component mirroring `apps/web/src/components/shared/address-autocomplete.tsx`
  - Text input with debounced search (300ms), dropdown suggestion list, tap to select
  - On select: PDOK lookup returns `straatnaam`, `huisnummer`, `postcode`, `woonplaatsnaam`, `centroide_ll` (WKT point with lat/lng)
  - Parse WKT point same as web: `POINT(lon lat)` regex
  - No map interaction needed: coordinates come from PDOK, free, no API keys
- Description (multi-line text area)

### `details.tsx` -- Step 2

- Price per month (number input with currency format)
- Service costs (optional number)
- Room size m2 (number)
- Rental type (select from `RentalType` enum)
- House type (select from `HouseType` enum)
- Furnishing (select from `Furnishing` enum)
- Features (multi-select from `RoomFeature` enum using `multi-chip-picker.tsx`)
- Available from / until (date pickers via `date-picker-sheet.tsx`)

### `preferences.tsx` -- Step 3

- Gender preference (select from `GenderPreference` enum)
- Max occupancy (number)
- Location tags (multi-select from `LocationTag` enum)

### `photos.tsx` -- Step 4

- Photo grid (up to 10 slots)
- "Take Photo" / "Choose from Library" action sheet (uses `expo-camera` + `expo-image-picker`)
- Drag-to-reorder photos
- Delete photo with confirm
- First photo becomes cover photo
- Upload progress indicator per photo

### `review.tsx` -- Step 5

- Summary of all entered data
- Photo preview carousel
- "Publish Room" button with confirmation dialog
- "Save as Draft" option
- Haptic on publish success

### Wizard state management

```typescript
// MMKV keys for wizard persistence
const WIZARD_KEYS = {
  houseId: 'wizard_house_id',
  basicInfo: 'wizard_basic_info',
  details: 'wizard_details',
  preferences: 'wizard_preferences',
  // Photos stored as uploaded URLs, not local state
} as const;
```

Clear wizard state on successful publish or explicit discard.

---

## Room Management (`my-rooms/[id]/`)

### `index.tsx` -- Room detail (owner perspective)

- Room photos carousel at top
- Status badge (published/draft/closed)
- Action buttons: Edit, Share, Close Room
- Stats: applicant count, event count, days listed
- Quick links to: Applicants, Events, Voting

### `edit.tsx` -- Edit form

- Reuses same form components from creation wizard
- Pre-populated with current room data
- Save with optimistic update

### `applicants.tsx` -- Applicant list

- `FlashList` of applicant cards
- Status filter tabs: All, New, Under Review, Accepted, Rejected
- Each card: avatar, name, status badge, "last active" timestamp
- Tap to view full applicant profile

### `applicant/[applicantUserId].tsx` -- Individual applicant review

- Full profile view (photos, bio, study info, personality, languages)
- Application cover letter
- Action buttons: Accept, Reject, Invite to Event
- Review history (if previously reviewed)

### `voting.tsx` -- Voting board

- Grid of applicant cards (photo + name)
- Vote buttons per applicant (thumbs up/down)
- Vote tally display
- "Voting is open" / "Voting closed" status

### `events/index.tsx` -- Events list

- List of hospi events (viewing events, meet & greets)
- Each card: title, date, attendee count, status
- FAB to create new event

### `events/create.tsx` -- Event creation

- Title, description inputs
- Date/time picker (native)
- Location input
- "Create Event" button

### `events/[eventId].tsx` -- Event detail

- Event info (title, date, location, description)
- Attendee list with RSVP status
- Cancel event action (for organizer)

### `events/invite.tsx` -- Batch invite

- Applicant selection list (checkboxes)
- "Send Invitations" button
- Haptic on success

### `close-room.tsx` -- Close room flow

- Select accepted applicant(s)
- Confirmation dialog
- Updates room status to closed
- Sends notifications to all applicants

### `share-link.tsx` -- Share link

- Share URL display (copyable)
- QR code (using `react-native-qrcode-svg`)
- "Regenerate Link" button
- Native share via `expo-sharing`

---

## UX Requirements (all 18 screens in this phase)

### Skeleton loading

- **My rooms list**: 2 `SkeletonRoomCard` while loading
- **Room detail (owner)**: Photo placeholder + stats row + 3 action button skeletons
- **Applicant list**: 3 applicant card skeletons (avatar + 2 lines)
- **Applicant review**: Profile photo placeholder + 4 section skeletons
- **Voting board**: Grid of 4 avatar circle skeletons
- **Events list**: 2 event card skeletons
- **Event detail**: Title + date + 3 attendee row skeletons
- **Wizard steps**: No skeleton (forms render instantly, only data pre-fill may need brief loading)

### Error handling

- **Room publish fails (validation)**: Specific field errors highlighted: "Add at least 1 photo", "Title is required"
- **Room publish fails (network)**: "Couldn't publish. Saved as draft." + auto-save to draft
- **Photo upload fails**: Per-photo error indicator with retry icon on the thumbnail
- **Accept/reject fails**: "Couldn't update applicant status. Try again." + retry
- **Event create fails**: "Couldn't create event." + keep form data for retry
- **Vote fails**: "Vote not saved. Try again." + optimistic rollback
- **Close room fails**: "Couldn't close room." + retry (don't lose selected applicant)
- **Share link regenerate fails**: "Couldn't generate new link." + keep old link visible
- **Address lookup fails (PDOK)**: "Couldn't find address. Check spelling and try again."

### Empty states

- **No rooms**: "You haven't listed any rooms yet." + "Create your first room" CTA button
- **No applicants**: "No applicants yet. Share your room to get more visibility!" + share CTA
- **No events**: "No events planned." + "Create an event" CTA
- **No votes**: "No votes yet. Voting opens when you have applicants."
- **Applicant filter empty**: "No applicants with this status." + "Show all" button

### Animations

- Room cards: `FadeIn` staggered entering
- Wizard step transitions: horizontal slide (`SlideInRight` / `SlideOutLeft`)
- Publish success: checkmark scale animation
- Applicant cards: `FadeIn` staggered entering
- Accept/reject: card slides out with status change animation
- Vote: thumb icon spring scale on tap
- Photo upload: progress ring animation per photo

### Haptic feedback

- Create room FAB: `hapticLight()`
- Wizard "Next" button: `hapticLight()`
- Wizard "Publish": `hapticMedium()`
- Publish success: `hapticSuccess()`
- Publish error: `hapticError()`
- Photo capture: `hapticLight()`
- Photo delete: `hapticMedium()`
- Accept applicant: `hapticSuccess()`
- Reject applicant: `hapticMedium()`
- Cast vote: `hapticLight()`
- Close room confirm: `hapticHeavy()`
- Share link copy: `hapticSelection()`
- Pull-to-refresh trigger: `hapticLight()`

### Accessibility

- Room cards: `accessibilityLabel="[title], [status], [price] per month, [applicant count] applicants"`
- Status badges: `accessibilityLabel="Status: [published/draft/closed]"` (not color-only)
- Create room FAB: `accessibilityLabel="Create new room"`
- Wizard step indicator: `accessibilityLabel="Step [n] of 6: [step name]"`
- Photo slots: `accessibilityLabel="Photo [n] of [total]. Tap to change."`
- Accept/reject buttons: `accessibilityLabel="Accept [name]"` / `"Reject [name]"`
- Vote buttons: `accessibilityLabel="Vote for [name]"`
- All touch targets minimum 44pt
- Address autocomplete suggestions: `accessibilityRole="button"` with full address as label

### Pull-to-refresh

- My rooms list: yes
- Room detail: yes
- Applicant list: yes
- Events list: yes
- Voting board: yes
- Wizard steps: no (form, not data list)
- Share link: no (static)

---

## Verification Checklist

- [ ] My rooms list shows skeletons on load (not spinner)
- [ ] Room creation wizard: all 6 steps with step indicator and smooth transitions
- [ ] Wizard progress persists in MMKV
- [ ] PDOK address autocomplete works (type -> suggestions -> select -> coordinates)
- [ ] Photo upload works with per-photo error/retry
- [ ] Publish failure auto-saves as draft with specific error
- [ ] Room edit saves with optimistic update
- [ ] Applicant list with skeletons, filters, and empty states
- [ ] Accept/reject with haptic and card animation
- [ ] Voting board with haptic on vote
- [ ] Event creation with error handling
- [ ] Close room with confirmation and haptic
- [ ] Share link with copy haptic and native share
- [ ] Pull-to-refresh on all list screens
- [ ] All empty states have CTAs
- [ ] All icon buttons have accessibilityLabel
- [ ] All touch targets minimum 44pt
