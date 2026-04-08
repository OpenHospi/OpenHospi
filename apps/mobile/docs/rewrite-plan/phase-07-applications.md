# Phase 7: Applications Tab

> Track sent applications and respond to event invitations.

## Summary

Rewrite 2 screens: applications list (status-grouped) and application detail (timeline view with RSVP).

---

## Applications List (`src/app/(app)/(tabs)/applications.tsx`) -- REWRITE

### Layout

- Status-grouped `SectionList` (or FlashList with section headers):
  - **Active**: Pending, under review
  - **Invited to Events**: Has pending event invitations
  - **Completed**: Accepted, rejected, withdrawn

- Each card (`application-card` inline component):
  - Room cover photo (expo-image with `cachePolicy="disk"`, `transition={200}`)
  - Room title + city
  - Application status badge (color-coded)
  - Date applied
  - Brief timeline preview ("Applied 3 days ago")

### Features

- Pull-to-refresh
- Empty state: "You haven't applied to any rooms yet. Start discovering!" with CTA to discover tab
- Tap card -> navigate to application detail
- Skeleton loading (3 application card skeletons)

### Data

- Uses `useApplications()` from `src/services/applications.ts`

---

## Application Detail (`src/app/(app)/application/[id].tsx`) -- REWRITE

### Layout (top to bottom)

1. **Room summary card**: Cover photo, title, price, city. Tap to view full room detail.

2. **Application timeline**: Visual vertical timeline showing status changes:

   ```
   o  Applied                    March 15
   |
   o  Under review               March 17
   |
   o  Invited to hospi event     March 20
   |
   ?  Awaiting decision          ---
   ```

   - Each step: colored dot + label + date
   - Current step highlighted/animated
   - Future steps dimmed

3. **Event invitation cards** (if invited to events):
   - Event title, date, location
   - RSVP buttons: Accept / Decline (binary, no decline reason -- less friction, no negative UX)
   - Optimistic update on RSVP

4. **Actions** (based on status):
   - **Pending/Under review**: "Withdraw Application" button (red, with confirmation)
   - **Accepted**: "Start Chat" button (navigates to conversation)
   - **Rejected/Withdrawn**: "Apply Again" or "Find More Rooms" CTA

### Animations

- Timeline dots animate in sequence on load (staggered FadeIn)
- RSVP button haptic feedback on press
- Withdrawal confirmation uses bottom sheet

### Data

- Uses `useApplicationDetail(id)` from `src/services/applications.ts`
- RSVP uses `useRespondToInvitation()` from `src/services/invitations.ts`
- Withdraw uses `useWithdrawApplication(id)` with optimistic update

---

## UX Requirements

### Skeleton loading

- **Applications list**: 3 `SkeletonApplicationCard` (photo rect + 2 text lines + badge)
- **Application detail**: Room card skeleton + 4 timeline dot skeletons

### Error handling

- **List fetch fails**: "Couldn't load applications." + retry button
- **Withdraw fails**: "Couldn't withdraw. Try again." + keep confirmation open for retry
- **RSVP accept fails**: "Couldn't accept invitation." + retry button on the card
- **RSVP decline fails**: "Couldn't decline." + retry
- **Detail fetch fails**: "Application not found." + back button

### Empty states

- **No applications**: "You haven't applied to any rooms yet. Start discovering!" + CTA to discover tab
- **No active applications**: "All caught up! No pending applications." (within section)
- **No event invitations**: "No event invitations yet."

### Animations

- Application cards: `FadeIn` staggered entering per section
- Timeline dots: staggered `FadeIn` in sequence (dot 1, then 2, then 3...)
- RSVP success: button transforms to checkmark with spring animation
- Withdraw: card slides out with `FadeOut`

### Haptic feedback

- RSVP accept: `hapticSuccess()`
- RSVP decline: `hapticMedium()`
- Withdraw confirm: `hapticHeavy()`
- Withdraw success: `hapticSuccess()`
- Pull-to-refresh trigger: `hapticLight()`
- Tap room card: `hapticLight()`

### Accessibility

- Application cards: `accessibilityLabel="Application to [room title], status: [status], applied [date]"`
- Status badges: not color-only, include text label
- Timeline steps: `accessibilityLabel="Step: [status], [date]"`
- RSVP buttons: `accessibilityLabel="Accept event invitation"` / `"Decline event invitation"`
- Withdraw button: `accessibilityLabel="Withdraw application"`
- All touch targets minimum 44pt

### Pull-to-refresh

- Applications list: yes
- Application detail: yes

---

## Verification Checklist

- [ ] Applications list shows skeletons on load (not spinner)
- [ ] Application cards with status badges, room photo, timeline preview
- [ ] Timeline dots animate in sequence
- [ ] RSVP accept/decline with optimistic update and haptic
- [ ] Withdraw with confirmation, haptic, and card animation
- [ ] Specific error messages for each failure type
- [ ] Empty state with CTA to discover tab
- [ ] Pull-to-refresh on both screens
- [ ] All elements have accessibilityLabel
- [ ] All touch targets minimum 44pt
