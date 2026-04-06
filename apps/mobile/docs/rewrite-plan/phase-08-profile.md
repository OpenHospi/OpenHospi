# Phase 8: Profile Tab

> User profile, 10 edit modals, settings with GDPR and biometric.

## Summary

Rewrite 14 files: profile screen, 10 edit modals (all as `@gorhom/bottom-sheet`), settings screen, plus 3 standalone screens (my-house, join, 404).

---

## Profile Screen (`src/app/(app)/(tabs)/profile.tsx`) -- REWRITE

### Layout (top to bottom)

1. **Avatar section**: Large profile photo with edit overlay button. Tap opens `edit-photos.tsx` modal.

2. **Photo carousel**: Horizontal scroll of profile photos (up to 6 slots). Page indicator dots.

3. **Section cards** (using `profile-section-card.tsx`):

   **Personal Info**:
   - First name, last name
   - Birth date
   - Gender + pronouns
   - Preferred city

   **Study Info**:
   - Study program
   - Study level
   - Student association (vereniging)

   **About Me**:
   - Bio (expandable text)

   **Languages**:
   - Language list with flags/icons

   **Lifestyle**:
   - Lifestyle tags as chips

4. **Footer**:
   - Settings button (gear icon) -> navigates to settings
   - Sign out button (red text)

### Interactions

- Each field row tappable -> opens corresponding edit modal
- Pull-to-refresh to reload profile
- Skeleton loading state

### Data

- Uses `useProfile()` from `src/services/profile.ts`

---

## Edit Modals (10 files in `(modals)/edit-*.tsx`)

All modals share the same pattern:

- **Presentation**: `@gorhom/bottom-sheet` modal (not full-screen, not RN Modal)
- **Animation**: Smooth spring open/close
- **Form**: `react-hook-form` with validation from `@openhospi/validators`
- **Save**: Haptic on success, optimistic update via `useUpdateProfile()`
- **Dismiss**: Swipe down or tap backdrop

| Modal                     | Input Type             | Notes                                  |
| ------------------------- | ---------------------- | -------------------------------------- |
| `edit-bio.tsx`            | Multi-line text area   | Character counter                      |
| `edit-birth-date.tsx`     | Date picker            | `date-picker-sheet.tsx` inside modal   |
| `edit-gender.tsx`         | Single-select chips    | From `Gender` enum                     |
| `edit-languages.tsx`      | Multi-select list      | From `Language` enum, with search      |
| `edit-lifestyle.tsx`      | Multi-select chips     | From `LifestyleTag` enum               |
| `edit-photos.tsx`         | Photo grid             | Camera + library, drag reorder, delete |
| `edit-preferred-city.tsx` | Single-select chips    | From `City` enum                       |
| `edit-study-level.tsx`    | Single-select chips    | From `StudyLevel` enum                 |
| `edit-study-program.tsx`  | Text input             | Free text with suggestions             |
| `edit-vereniging.tsx`     | Single-select + search | From `Vereniging` enum                 |

---

## Settings (`src/app/(app)/settings.tsx`) -- REWRITE

### Sections

**Account**:

- Email (read-only, from session)
- Institution (read-only, from InAcademia)
- Active sessions list (with "Log out" per session)
- "Log out of all sessions" button

**Privacy**:

- Consent management toggles (per `ConsentPurpose` enum)
- GDPR data export request (NEW):
  - "Request my data" button
  - Confirmation dialog
  - Status tracking (requested -> processing -> ready)
  - Uses new `useRequestDataExport()` hook
- "Delete my account" button (destructive, with confirmation)

**Preferences**:

- Language picker (NL/EN/DE)
- Biometric unlock toggle (Face ID / fingerprint):
  - Uses `isBiometricAvailable()` to check hardware
  - On toggle on: authenticate first, then save preference to MMKV
  - On toggle off: clear MMKV preference

**About**:

- App version
- Terms of service link
- Privacy policy link
- Open source licenses

---

## Other Standalone Screens

### `my-house.tsx` -- REWRITE

- House name and info
- Member list with roles (owner, moderator, member)
- Invite code display + share
- Leave house action

### `join/[code].tsx` -- REWRITE

- Preview house info before joining
- "Join House" confirmation button
- Error state if code is invalid/expired

### `+not-found.tsx` -- REWRITE

- Friendly 404 screen with illustration
- "Go Home" button navigates to discover tab

---

## Verification Checklist

- [ ] Profile loads with photo carousel and all sections
- [ ] Each field row navigates to correct edit modal
- [ ] All 10 edit modals open as bottom sheet (not full-screen)
- [ ] Edit modals save with optimistic update and haptic
- [ ] Photo edit: camera capture, library pick, reorder, delete all work
- [ ] Settings: active sessions display correctly
- [ ] Settings: GDPR data export request submits
- [ ] Settings: biometric toggle works (prompt on enable)
- [ ] Settings: language change takes effect immediately
- [ ] Settings: delete account flows through confirmation
- [ ] My house: member list and invite code display
- [ ] Join house: preview and join work
- [ ] Sign out clears session and navigates to login
- [ ] Pull-to-refresh works on profile
