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

## Edit Modals (consolidated from 10 to 6)

All modals share the same pattern:

- **Presentation**: `@gorhom/bottom-sheet` modal (not full-screen, not RN Modal)
- **Animation**: Smooth spring open/close
- **Form**: `react-hook-form` with validation from `@openhospi/validators`
- **Save**: Haptic on success, optimistic update via `useUpdateProfile()`
- **Dismiss**: Swipe down or tap backdrop

| Modal                    | Fields                                   | Notes                                                                                               |
| ------------------------ | ---------------------------------------- | --------------------------------------------------------------------------------------------------- |
| `edit-personal-info.tsx` | Birth date + gender + preferred city     | 3 fields in one sheet. Preferred city uses PDOK city search (`city-search.tsx`), not enum dropdown. |
| `edit-study-info.tsx`    | Study program + study level + vereniging | 3 fields grouped in one sheet (replaces 3 separate modals)                                          |
| `edit-bio.tsx`           | Multi-line text area                     | Character counter. Kept separate (heavy interaction)                                                |
| `edit-languages.tsx`     | Multi-select list with search            | From `Language` enum. Kept separate (complex picker)                                                |
| `edit-lifestyle.tsx`     | Multi-select chips                       | From `LifestyleTag` enum. Kept separate (chip picker)                                               |
| `edit-photos.tsx`        | Photo grid                               | Camera + library, drag reorder, delete. Kept separate (complex interaction)                         |

**Removed as separate modals** (merged into personal-info and study-info):

- ~~`edit-birth-date.tsx`~~ -> merged into `edit-personal-info.tsx`
- ~~`edit-gender.tsx`~~ -> merged into `edit-personal-info.tsx`
- ~~`edit-preferred-city.tsx`~~ -> merged into `edit-personal-info.tsx`
- ~~`edit-study-level.tsx`~~ -> merged into `edit-study-info.tsx`
- ~~`edit-study-program.tsx`~~ -> merged into `edit-study-info.tsx`
- ~~`edit-vereniging.tsx`~~ -> merged into `edit-study-info.tsx`

### Photo moderation error handling

- **Photo rejected (NSFWJS)**: "This image can't be uploaded. Please choose a different photo." Remove thumbnail, show error on slot.
- **Photo flagged (NSFWJS)**: "Photo uploaded. It will be visible after a brief review." Show photo with "Under review" badge.

### Profile completion indicator

- Subtle progress ring around avatar (e.g. 80% complete)
- "Complete your profile" banner below avatar if missing photos or bio
- Calculation: count filled fields / total fields (photos, bio, languages, lifestyle, study info, personal info)
- Like LinkedIn's profile strength meter but less aggressive

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

## UX Requirements

### Skeleton loading

- **Profile screen**: Large avatar circle skeleton + 3 section card skeletons
- **Edit modals**: No skeleton (forms with pre-filled data, instant)
- **Settings**: 4 section header skeletons + 3 row skeletons per section
- **My house**: House name skeleton + 3 member row skeletons
- **Join house**: House preview card skeleton

### Error handling

- **Profile fetch fails**: "Couldn't load profile." + retry button
- **Profile update fails**: "Couldn't save changes. Try again." + keep modal open with data
- **Photo upload fails**: Per-photo error with retry icon on thumbnail
- **Photo delete fails**: "Couldn't delete photo." + retry
- **Session logout fails**: "Couldn't log out session." + retry
- **GDPR export fails**: "Request failed. Try again later."
- **Delete account fails**: "Couldn't delete account. Contact support." (critical, don't lose data)
- **Biometric setup fails**: "Face ID not available. Check your device settings."
- **Join house invalid code**: "Invalid or expired code. Check with your housemates."
- **Leave house fails**: "Couldn't leave house." + retry

### Empty states

- **No profile photos**: "Add photos so housemates can get to know you!" + add photo CTA
- **No languages selected**: "Add your languages" + add CTA
- **No lifestyle tags**: "Tell people about your lifestyle" + add CTA
- **No house members** (shouldn't happen, but): "Invite housemates" + share invite code CTA
- **No active sessions** (shouldn't happen): handled by always showing current session

### Animations

- Profile sections: `FadeIn` staggered entering on initial load
- Edit modal open/close: spring animation (gorhom bottom-sheet default)
- Save success: brief green flash on the edited field row
- Photo reorder: drag animation
- Photo delete: fade out + collapse
- Sign out: fade-to-login transition
- Settings toggles: smooth switch animation (native)

### Haptic feedback

- Field row tap (open edit modal): `hapticLight()`
- Edit modal save: `hapticSuccess()`
- Edit modal error: `hapticError()`
- Photo capture: `hapticLight()`
- Photo delete: `hapticMedium()`
- Settings toggle (biometric, consent): `hapticSelection()`
- Session logout: `hapticMedium()`
- Delete account confirm: `hapticHeavy()`
- Sign out: `hapticMedium()`
- Leave house confirm: `hapticHeavy()`
- Join house success: `hapticSuccess()`
- Copy invite code: `hapticSelection()`
- Pull-to-refresh trigger: `hapticLight()`

### Accessibility

- Profile photo: `accessibilityLabel="Profile photo. Tap to edit."`
- Section cards: `accessibilityRole="button"`, label includes current value
- Field rows: `accessibilityLabel="[field name]: [current value]. Tap to edit."`
- Settings gear icon: `accessibilityLabel="Settings"`
- Sign out button: `accessibilityLabel="Sign out of OpenHospi"`
- Delete account: `accessibilityLabel="Delete account permanently"` (destructive action)
- Biometric toggle: `accessibilityLabel="Face ID unlock: [on/off]"`
- All touch targets minimum 44pt
- Photo thumbnails: `accessibilityLabel="Photo [n]. Tap to view or remove."`

### Pull-to-refresh

- Profile screen: yes
- Settings screen: yes (reload sessions, consent status)
- My house: yes
- Edit modals: no (form, not data)
- Join house: no (one-time action)

---

## Verification Checklist

- [ ] Profile loads with skeleton (not spinner)
- [ ] Photo carousel with large, swipeable photos
- [ ] Each field row has chevron, haptic on tap, opens correct modal
- [ ] All 10 edit modals open as bottom sheet with spring animation
- [ ] Edit modals save with optimistic update, haptic, and brief success flash
- [ ] Specific error messages for each failure type
- [ ] Photo edit: camera, library, reorder, delete with per-photo error handling
- [ ] Settings loads with skeleton
- [ ] GDPR export request with specific error/success feedback
- [ ] Biometric toggle with auth prompt and haptic
- [ ] Language change takes effect immediately
- [ ] Delete account with haptic heavy and confirmation
- [ ] Join house with specific invalid code error
- [ ] All elements have accessibilityLabel
- [ ] All touch targets minimum 44pt
- [ ] Pull-to-refresh on profile and settings
