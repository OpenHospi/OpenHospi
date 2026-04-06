# Phase 1: Backend Hardening

> Do FIRST, before any UI work. The UI rewrite depends on reliable data fetching.

## Summary

Fix critical bugs and optimize the data layer: API client, React Query services, session management, network handling, Supabase Realtime.

---

## 1. API Client (`src/lib/api-client.ts`) -- REWRITE

### Critical fixes

- **Add request timeout**: `AbortController` with 30s default, 10s for auth refresh. Dead connections currently block indefinitely.
- **Add request deduplication**: Memoize by `method+URL+body` with 100-500ms TTL. Two simultaneous identical requests currently both hit the network.
- **Fix NetworkError catch**: Currently only catches `TypeError` with "Network" in message. Widen to include `AbortError` and DNS failures.
- **Add Sentry breadcrumbs**: Error parsing failures are silently swallowed (line 106-108). Log to Sentry for debugging.

### Nice-to-have

- Add `ETag`/`If-Modified-Since`/304 support (reduces bandwidth on mobile)
- Add exponential backoff with jitter on session refresh retry (currently immediate retry)

---

## 2. Query Client (`src/lib/query-client.ts`) -- OPTIMIZE

| Setting           | Current            | Target                       | Why                                           |
| ----------------- | ------------------ | ---------------------------- | --------------------------------------------- |
| GC time           | 24 hours           | 30-60 minutes                | 24h causes memory pressure on low-end Android |
| Stale times       | 5 min global       | Per-query (see below)        | Different data has different freshness needs  |
| Offline mutations | `sendMessage` only | + 4 more (see below)         | Critical mutations lost on network drop       |
| Mutation recovery | None               | retry: 1, throwOnError: true | Failed mutations stay in stale state          |
| Cache size        | Unbounded          | 10-20 MB cap                 | Eventually fills device storage               |

### Per-query stale time configs

| Data type          | Stale time  | Why                               |
| ------------------ | ----------- | --------------------------------- |
| Chat/notifications | 30 seconds  | Near-realtime data                |
| E2EE verification  | 30 seconds  | Security-critical                 |
| Profile/settings   | 2-3 minutes | Personal data, moderate freshness |
| Rooms/applications | 5 minutes   | List data, acceptable staleness   |
| Houses/static data | 10 minutes  | Rarely changes                    |

### Expand offline mutation persistence to

- `sendMessage` (already persisted)
- `applyToRoom`
- `uploadProfilePhoto`
- `uploadRoomPhoto`
- `markConversationRead`

---

## 3. Session Management (`src/context/session.tsx`) -- FIX BUGS

### Bug 1: Loading state (line 33)

**Current** (broken during load):

```typescript
const needsOnboarding = !!session && !(onboardingStatus?.isComplete ?? false);
// When onboardingStatus is undefined: !(undefined ?? false) = !false = true
```

**Fix**: Check `=== false` explicitly:

```typescript
const needsOnboarding = !!session && onboardingStatus?.isComplete === false;
```

### Bug 2: Stale cache on session switch

Invalidate onboarding query when `session.id` changes to prevent old user's data showing for new user.

### Enhancement: Explicit auth state enum

Replace three booleans with: `'loading' | 'authenticated' | 'needs-onboarding' | 'unauthenticated'`

---

## 4. Network Manager (`src/lib/network.ts`) -- FIX BUGS

- **Dual listener** (lines 56, 60-65): `addNetworkStateListener` called twice. Fix: only register once.
- **Race condition**: `getNetworkStateAsync()` not awaited but `initialized` set synchronously.
- **Debounce**: Add 100-200ms debounce on restore callbacks to prevent query floods on WiFi flapping.

---

## 5. Supabase Realtime (`src/lib/supabase.ts`) -- FIX BUGS

- **Connection status** (line 83): `activeChannels.size <= 1` sets disconnected when 1 channel still active.
- **No backoff**: `reconnectAllChannels()` hammers server. Add exponential backoff: 100ms -> 1s -> 5s -> 30s max.
- **No heartbeat timeout**: Dead connections stay in `connected` state. Auto-reconnect after 45s without heartbeat.
- **No rate limiting**: Debounce reconnect with 500ms-1s window.
- **Duplicate listeners**: Lines 76-87 AND 124-130 both subscribe to channel status. Fix: single handler.

---

## 6. App Lifecycle (`src/lib/app-lifecycle.ts`) -- OPTIMIZE

- Pause React Query polling during background (saves battery)
- Wrap foreground callbacks in try/catch (one failure shouldn't break others)
- Treat `inactive` state as `background` for callback purposes

---

## 7. Notifications (`src/lib/notifications.ts`) -- FIX

- Push token registration: fails silently with `.catch(console.error)`. Add Sentry error capture.
- Notification type strings: use shared enums from `@openhospi/shared` instead of hardcoded strings.

---

## 8. React Query Services (`src/services/*.ts`) -- OPTIMIZE ALL 12 FILES

### For ALL mutations

- Add `onError` callbacks with user-facing error feedback
- Add optimistic updates where missing (mark-as-read, withdraw, settings, RSVP)
- Use `exact: true` on targeted invalidations

### Specific fixes per file

| File               | Issue                                                  | Fix                                         |
| ------------------ | ------------------------------------------------------ | ------------------------------------------- |
| `notifications.ts` | Offset pagination (`page` param, line 25)              | Cursor-based with `lastNotificationId`      |
| `my-rooms.ts`      | N+1 pattern: separate API call per room for applicants | Batch query endpoint + hook                 |
| `my-rooms.ts`      | `Record<string, unknown>` on 6 mutations               | Typed payloads from `@openhospi/validators` |
| `profile.ts`       | `Record<string, unknown>` (line 23)                    | `UpdateProfilePayload` type                 |
| `onboarding.ts`    | `Record<string, unknown>` (line 43)                    | Typed onboarding payload                    |
| `verification.ts`  | 5 min stale time for E2EE key check                    | Reduce to 30 seconds                        |
| `verification.ts`  | `useKeyChangeDetection` returns false on error         | Add `isError` state                         |
| `chat.ts`          | Sending one message invalidates ALL conversations      | Only invalidate specific conversation       |
| `invitations.ts`   | RSVP invalidates chat conversations (line 34)          | Remove unnecessary invalidation             |
| All services       | `.then(r => r.data)` in queryFn                        | Move to memoized `select` option            |

---

## 9. Calendar (`src/lib/calendar.ts`) -- MINOR FIX

Line 73: replace hardcoded `openhospi.nl` with `API_BASE_URL` from constants.

---

## 10. NSFWJS Image Moderation (server-side)

> Free, GDPR-perfect image screening for all photo uploads across web and mobile.

### Why server-side only

`@tensorflow/tfjs-react-native` is dead: last release 2 years ago, broken with Expo 51+ (GitHub issue tensorflow/tfjs#8292), requires old `expo-camera` v13 incompatible with SDK 55. On-device is NOT viable. Don't waste time trying.

### Install

In `apps/web`:

```bash
pnpm --filter @openhospi/web add nsfwjs @tensorflow/tfjs-node
```

### Shared moderation utility

Create `apps/web/src/lib/services/image-moderation.ts`:

```typescript
import * as nsfwjs from 'nsfwjs';
import * as tf from '@tensorflow/tfjs-node';

let model: nsfwjs.NSFWJS | null = null;

async function getModel() {
  if (!model) {
    model = await nsfwjs.load();
  }
  return model;
}

type ModerationResult = {
  allowed: boolean;
  flagged: boolean;
  category: string;
  confidence: number;
};

export async function moderateImage(buffer: Buffer): Promise<ModerationResult> {
  const nsfw = await getModel();
  const image = tf.node.decodeImage(buffer, 3);
  const predictions = await nsfw.classify(image as tf.Tensor3D);
  image.dispose();

  const porn = predictions.find((p) => p.className === 'Porn');
  const hentai = predictions.find((p) => p.className === 'Hentai');
  const sexy = predictions.find((p) => p.className === 'Sexy');

  if ((porn && porn.probability > 0.8) || (hentai && hentai.probability > 0.8)) {
    return {
      allowed: false,
      flagged: false,
      category: porn?.className ?? 'Hentai',
      confidence: Math.max(porn?.probability ?? 0, hentai?.probability ?? 0),
    };
  }
  if (sexy && sexy.probability > 0.7) {
    return { allowed: true, flagged: true, category: 'Sexy', confidence: sexy.probability };
  }
  return { allowed: true, flagged: false, category: 'Neutral', confidence: 1 };
}
```

- Model loaded once (singleton, lazy init like DB proxy)
- ~3.5MB model, ~200ms per image
- 5 categories: Neutral, Drawing, Sexy, Porn, Hentai (~93% accuracy)
- Reusable by mobile API routes AND web server actions

### Routes to modify

**Mobile API routes** (in `apps/web/src/app/api/mobile/`):

- `profile/photos/route.ts` -- screen before saving to `profile-photos` bucket
- `my-rooms/[id]/photos/route.ts` -- screen before saving to `room-photos` bucket

**Web server actions** (in `apps/web/src/lib/services/`):

- `profile-mutations.ts` -- photo upload function
- `room-mutations.ts` -- photo upload function

### Thresholds

| NSFWJS Result      | Confidence | Action                                 | `moderation_status` |
| ------------------ | ---------- | -------------------------------------- | ------------------- |
| Porn or Hentai     | > 0.8      | **Reject** -- don't save, return error | N/A (not saved)     |
| Sexy               | > 0.7      | **Flag** -- save but hide from public  | `'pending_review'`  |
| Neutral or Drawing | any        | **Allow** -- save normally             | `'approved'`        |

### Database schema change

Add `moderation_status` to `profile_photos` and `room_photos` tables in `packages/database/src/schema/`:

```typescript
import { pgEnum } from 'drizzle-orm/pg-core';

export const moderationStatusEnum = pgEnum('moderation_status', ['approved', 'pending_review', 'rejected']);

// In profile_photos and room_photos tables:
moderationStatus: moderationStatusEnum('moderation_status').default('approved').notNull(),
```

**RLS update**: Discover and public room queries must filter `WHERE moderation_status = 'approved'`. Flagged photos visible only to the uploader and admins.

### Admin dashboard (`apps/admin`)

New page: **Image Review Queue**

- List all photos with `moderation_status = 'pending_review'`
- Show: photo thumbnail, NSFWJS category + confidence score, uploader name, room (if room photo)
- Actions per photo: **Approve** (set `'approved'`) or **Reject** (set `'rejected'`, notify user)
- Simple table with action buttons -- no complex UI needed
- Query: `SELECT * FROM profile_photos WHERE moderation_status = 'pending_review' UNION SELECT * FROM room_photos WHERE moderation_status = 'pending_review'`

### Error responses

**Rejected upload** (Porn/Hentai > 0.8):

- HTTP 422 with body: `{ error: { code: "INAPPROPRIATE_CONTENT", message: "This image contains inappropriate content" } }`
- Web: toast "This image contains inappropriate content. Please choose a different photo."
- Mobile: same message in upload error handler

**Flagged upload** (Sexy > 0.7):

- HTTP 200 (upload succeeds) with body: `{ flagged: true, message: "Photo uploaded. It will be visible after a brief review." }`
- Web: info toast "Photo uploaded. It will be visible after a brief review."
- Mobile: info message same text

**Clean upload** (Neutral/Drawing):

- HTTP 200 (upload succeeds) -- no extra feedback, normal flow

---

## Verification Checklist

### Mobile backend hardening (DONE)

- [x] `pnpm --filter @openhospi/mobile typecheck` passes with strict service types
- [x] `pnpm --filter @openhospi/mobile lint` passes
- [x] API client: timeout via AbortController (30s default, 10s auth refresh)
- [x] API client: GET request deduplication (in-flight cache)
- [x] API client: wider error catch (AbortError + TypeError)
- [x] API client: Sentry breadcrumb on error parse failure
- [x] API client: session refresh backoff with jitter
- [x] Session: `needsOnboarding` fixed (`=== true`/`=== false`)
- [x] Session: cache invalidation on session switch
- [x] Network: 200ms debounce on restore callbacks
- [x] App lifecycle: foreground + background callbacks wrapped in try/catch with Sentry
- [x] Supabase: fixed `activeChannels.size` bug (delete then check)
- [x] Supabase: exponential backoff with jitter on reconnect (100ms -> 30s max)
- [x] Supabase: reset attempts on SUBSCRIBED
- [x] Notifications (lib): Sentry on push token registration failure
- [x] Calendar: replaced hardcoded domain with API_BASE_URL
- [x] Query client: GC time reduced from 24h to 30min
- [x] Query client: expanded offline mutation persistence (5 mutations)
- [x] Query client: mutation retry:1 + throwOnError:true
- [x] Query client: cache size filtering in serializer
- [x] All queries have explicit staleTime from STALE_TIMES
- [x] my-rooms.ts: 9 `.then()` transforms replaced with `select`
- [x] my-rooms.ts: 7 `Record<string, unknown>` replaced with typed payloads
- [x] profile.ts: typed UpdateProfilePayload
- [x] onboarding.ts: typed SubmitAboutPayload
- [x] chat.ts: fixed over-invalidation (only specific conversation, not all)
- [x] invitations.ts: removed unnecessary chat.conversations() invalidation from RSVP
- [x] verification.ts: staleTime + isError on useKeyChangeDetection
- [x] notifications.ts (svc): select transform on unreadCount + staleTime

### Server-side work (DONE)

- [x] Notifications: cursor-based pagination (server API + mobile service updated)
- [x] NSFWJS: installed `nsfwjs` + `@tensorflow/tfjs-node` in `apps/web`
- [x] NSFWJS: created shared moderation utility (`apps/web/src/lib/services/image-moderation.ts`)
- [x] NSFWJS: integrated into mobile API photo upload routes (profile + room photos)
- [x] NSFWJS: integrated into web server action photo upload functions (profile-mutations + room-mutations)
- [x] DB: added `moderation_status` column to `profile_photos` and `room_photos` tables
- [x] RLS: discover/public queries filter `moderation_status = 'approved'` (cover photo joins + full photo list)
- [x] Web + mobile typecheck passes

### Remaining action

- [ ] DB: `db:push` to apply schema changes (run manually when Supabase is running)

### Moved to other docs (fully tracked, not lost)

- Mutation `onError` callbacks -> moved to `phase-02-foundation.md` (needs toast component first)
- Admin image review queue -> moved to `phase-1.1-admin-review-queue.md` (separate scope)
