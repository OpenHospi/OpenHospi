# Phase 1.1: Admin Image Review Queue

> New admin dashboard page for reviewing flagged photos from NSFWJS moderation.

## Context

Phase 1 added NSFWJS image moderation to all photo upload routes. Photos flagged as "Sexy" (confidence > 0.7) are saved with `moderation_status = 'pending_review'` and hidden from public views. An admin needs to review these and approve or reject them.

## Prerequisites

- [x] NSFWJS installed and integrated (Phase 1, done)
- [x] `moderation_status` column on `profile_photos` and `room_photos` (Phase 1, done)
- [x] Discover queries filter `moderation_status = 'approved'` (Phase 1, done)
- [ ] `db:push` applied (schema ready, needs Supabase running)

## Scope

**App**: `apps/admin` (the admin dashboard, separate from the mobile app)

This is a web-only feature. No mobile admin interface needed.

---

## New Page: Image Review Queue

### Route

`apps/admin/src/app/[locale]/(admin)/moderation/page.tsx`

### Layout

Simple table with:

| Column       | Content                                              |
| ------------ | ---------------------------------------------------- |
| Preview      | Photo thumbnail (100x100)                            |
| Type         | "Profile" or "Room"                                  |
| NSFWJS Score | Category + confidence (e.g. "Sexy: 0.74")            |
| Uploader     | User name + ID                                       |
| Room         | Room title (if room photo, otherwise "--")           |
| Uploaded     | Timestamp                                            |
| Actions      | **Approve** button (green) + **Reject** button (red) |

### Data Query

```sql
-- Fetch all photos pending review
SELECT 'profile' as type, pp.id, pp.url, pp.uploaded_at, pp.user_id,
       p.first_name, p.last_name, NULL as room_id, NULL as room_title
FROM profile_photos pp
JOIN profiles p ON p.id = pp.user_id
WHERE pp.moderation_status = 'pending_review'

UNION ALL

SELECT 'room' as type, rp.id, rp.url, rp.uploaded_at, r.created_by as user_id,
       p.first_name, p.last_name, r.id as room_id, r.title as room_title
FROM room_photos rp
JOIN rooms r ON r.id = rp.room_id
JOIN profiles p ON p.id = r.created_by
WHERE rp.moderation_status = 'pending_review'

ORDER BY uploaded_at DESC
```

### Server Actions

**Approve photo:**

```typescript
async function approvePhoto(photoId: string, type: 'profile' | 'room') {
  const table = type === 'profile' ? profilePhotos : roomPhotos;
  await db.update(table).set({ moderationStatus: 'approved' }).where(eq(table.id, photoId));
}
```

**Reject photo:**

```typescript
async function rejectPhoto(photoId: string, type: 'profile' | 'room') {
  const table = type === 'profile' ? profilePhotos : roomPhotos;
  await db.update(table).set({ moderationStatus: 'rejected' }).where(eq(table.id, photoId));
  // Optionally: delete from storage, notify user
}
```

### UI

- Simple table with shadcn/ui `Table` component
- No pagination needed initially (flagged photos should be rare with 0.7 threshold)
- If queue grows: add pagination later
- Approve/Reject buttons with confirmation dialog
- After action: row disappears from table (optimistic or refetch)
- Empty state: "No photos pending review" with checkmark icon

### Notifications (optional enhancement)

When a photo is rejected, optionally notify the user:

- "Your photo was removed because it didn't meet our content guidelines. Please upload a different photo."
- Uses existing notification system

---

## Files Created/Modified (DONE)

| File                                                                            | Action                                                                             |
| ------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| `packages/shared/src/enums/admin.ts`                                            | DONE: added `moderate_photo` to AdminAction                                        |
| `apps/admin/src/components/admin-nav-config.ts`                                 | DONE: added imageReview nav entry with ImageOff icon                               |
| `packages/i18n/messages/en/admin.json`                                          | DONE: added imageReview translation keys                                           |
| `packages/i18n/messages/nl/admin.json`                                          | DONE: added imageReview translation keys                                           |
| `packages/i18n/messages/de/admin.json`                                          | DONE: added imageReview translation keys                                           |
| `apps/admin/src/app/[locale]/(dashboard)/image-review/actions.ts`               | DONE: server actions (getFlaggedPhotos, getReviewStats, approvePhoto, rejectPhoto) |
| `apps/admin/src/app/[locale]/(dashboard)/image-review/image-review-columns.tsx` | DONE: column definitions with thumbnails, badges, actions                          |
| `apps/admin/src/app/[locale]/(dashboard)/image-review/image-review-actions.tsx` | DONE: approve/reject buttons with AlertDialog confirmation + Sonner toasts         |
| `apps/admin/src/app/[locale]/(dashboard)/image-review/image-review-table.tsx`   | DONE: TanStack React Table with sorting + pagination                               |
| `apps/admin/src/app/[locale]/(dashboard)/image-review/page.tsx`                 | DONE: server component with stats cards + table + empty state                      |

---

## Verification Checklist

- [x] Admin nav shows "Image Review" link with ImageOff icon
- [x] `pnpm --filter @openhospi/admin typecheck` passes
- [x] `pnpm --filter @openhospi/admin lint` passes (0 errors)
- [x] Page has stats cards (pending count + reviewed today)
- [x] Table shows flagged photos with thumbnails, type badges, uploader name, room title, upload date
- [x] Approve button has AlertDialog confirmation, calls server action, shows success toast
- [x] Reject button has AlertDialog confirmation (destructive variant), calls server action, shows success toast
- [x] Empty state shows ImageOff icon + message when no photos pending
- [x] Translation keys in all 3 locales (en, nl, de)
- [x] Audit log records moderation actions with `AdminAction.moderate_photo`
- [ ] Manual test: approve photo -> visible in discover queries (requires running app + db:push)
- [ ] Manual test: reject photo -> stays hidden (requires running app + db:push)
