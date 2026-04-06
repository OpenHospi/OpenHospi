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

## Verification Checklist

- [ ] `pnpm --filter @openhospi/mobile typecheck` passes with strict service types
- [ ] API client: timeout fires after 30s
- [ ] API client: duplicate simultaneous requests are deduplicated
- [ ] Session: `needsOnboarding` stays `false` during loading state
- [ ] Network: only ONE listener fires per state change
- [ ] Supabase: reconnect uses exponential backoff
- [ ] Offline: `applyToRoom` queues when airplane mode on, sends on reconnect
- [ ] All mutations have `onError` callbacks
- [ ] No `Record<string, unknown>` in mutation payloads
- [ ] Notifications use cursor pagination
