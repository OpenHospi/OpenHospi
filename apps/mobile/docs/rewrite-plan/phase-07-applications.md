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
  - Room cover photo (CachedImage)
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
   - RSVP buttons: Accept / Decline
   - Decline reason input (optional bottom sheet)
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

## Verification Checklist

- [ ] Applications list shows correct status-grouped sections
- [ ] Application cards display room photo, title, status badge
- [ ] Application detail timeline renders correctly for each status
- [ ] RSVP accept/decline works with optimistic update
- [ ] Withdraw application works with confirmation
- [ ] Pull-to-refresh works
- [ ] Empty state shows when no applications
- [ ] Skeleton loading shows while data fetches
- [ ] Tap room card in detail navigates to room detail screen
