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
- Address (text input)
- Location picker: `expo-maps` mini-map where user can drag a pin to set approximate room location
- Uses `expo-maps` `onMapClick` to capture coordinates

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

## Verification Checklist

- [ ] My rooms list shows correct status badges and colors
- [ ] Room creation wizard: all 6 steps complete and publish successfully
- [ ] Wizard progress persists in MMKV (kill app mid-wizard, reopen, data preserved)
- [ ] Location picker works on both iOS and Android maps
- [ ] Photo upload works (camera + library)
- [ ] Room edit saves with optimistic update
- [ ] Applicant list filters work (All/New/Under Review/etc.)
- [ ] Accept/reject applicant works
- [ ] Voting board records votes
- [ ] Event creation + invite flow works end-to-end
- [ ] Close room flow completes correctly
- [ ] Share link generates and opens native share sheet
- [ ] Pull-to-refresh works on all list screens
- [ ] Empty states show on all screens with no data
