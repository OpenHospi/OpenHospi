# @openhospi/shared

Single source of truth for enums, constants, types, and shared utilities across the OpenHospi monorepo.

## Package Structure

```
src/
  index.ts                    # Re-exports everything
  enums/
    index.ts                  # All 28 small enums + re-exports
    define-enum.ts            # defineEnum() helper (internal)
    cities.ts                 # City enum (60 Dutch cities)
    verenigingen.ts           # Vereniging enum (182 student associations)
    transitions.ts            # State machine maps, validators, status categories
  constants/
    index.ts                  # Re-exports all constant modules
    app.ts                    # APP_NAME, BRAND_COLOR, PRIVACY_POLICY_VERSION, SESSION_COOKIE_NAME
    validation.ts             # Text length limits (MAX_BIO_LENGTH, MAX_ROOM_TITLE_LENGTH, etc.)
    media.ts                  # Photo counts, file sizes, ALLOWED_IMAGE_TYPES, JPEG_QUALITY
    storage.ts                # STORAGE_BUCKET_*, CONSENT_*, StorageBucket type
    pagination.ts             # ROOMS_PER_PAGE, APPLICATIONS_PER_PAGE, MESSAGES_PER_PAGE, etc.
    events.ts                 # MAX_EVENT_TITLE_LENGTH, MAX_INVITATIONS_PER_EVENT, REMINDER_HOURS, etc.
    rate-limits.ts            # All RATE_LIMIT_* constants
    crypto.ts                 # PBKDF2_ITERATIONS, PIN_LENGTH, Signal Protocol constants
    retention.ts              # All RETENTION_*_DAYS constants
    forms.ts                  # ONBOARDING_TOTAL_STEPS, EMAIL_CODE_LENGTH, EMAIL_RESEND_COOLDOWN_SECONDS
    external.ts               # PDOK URLs, TRUSTPILOT_URL, etc.
    discover.ts               # PRICE_MIN, PRICE_MAX, PRICE_STEP
    map.ts                    # MAP_DEFAULT_ZOOM, MAP_PRIVACY_RADIUS, MAP_PRIVACY_OFFSET, etc.
    layout.ts                 # MOBILE_BREAKPOINT, LEGAL_HEADER_OFFSET, OG_IMAGE_SIZE, APPLE_ICON_SIZE
    ux.ts                     # COPY_FEEDBACK_TIMEOUT_MS, ADDRESS_DEBOUNCE_MS
  calendar.ts                 # ICS generation utility
  icons/                      # LogoIcon, OutlookIcon
```

## Import Paths

```ts
// Everything (enums + constants + calendar)
import {Gender, APP_NAME} from "@openhospi/shared";

// Just enums
import {RoomStatus, City} from "@openhospi/shared/enums";

// Just constants
import {MAX_BIO_LENGTH, STORAGE_BUCKET_ROOM_PHOTOS} from "@openhospi/shared/constants";

// Specific constant module
import {MAP_DEFAULT_ZOOM} from "@openhospi/shared/constants/map";

// Calendar utility
import {generateICS} from "@openhospi/shared/calendar";

// Icons (React components)
import {LogoIcon} from "@openhospi/shared/icons";

// Types
import type {StorageBucket, AllowedImageType} from "@openhospi/shared/constants";
import type {Gender, RoomStatus} from "@openhospi/shared/enums";
```

## Naming Conventions

### Constants: `SCREAMING_SNAKE_CASE`

| Pattern            | When to use                             | Examples                                     |
|--------------------|-----------------------------------------|----------------------------------------------|
| `MAX_*` / `MIN_*`  | Upper/lower bounds                      | `MAX_BIO_LENGTH`, `MIN_LANGUAGES`            |
| `*_PER_PAGE`       | Pagination sizes                        | `ROOMS_PER_PAGE`, `MESSAGES_PER_PAGE`        |
| `RATE_LIMIT_*`     | Rate limits                             | `RATE_LIMIT_APPLY`, `RATE_LIMIT_CREATE_ROOM` |
| `RETENTION_*_DAYS` | Data retention periods (always in days) | `RETENTION_SESSION_IP_DAYS`                  |
| `*_MS`             | Durations in milliseconds               | `COPY_FEEDBACK_TIMEOUT_MS`                   |
| `*_SECONDS`        | Durations in seconds                    | `EMAIL_RESEND_COOLDOWN_SECONDS`              |
| `STORAGE_BUCKET_*` | Supabase storage bucket names           | `STORAGE_BUCKET_PROFILE_PHOTOS`              |
| `MAP_*`            | Map display configuration               | `MAP_DEFAULT_ZOOM`, `MAP_PRIVACY_RADIUS`     |
| `PRICE_*`          | Price filter configuration              | `PRICE_MIN`, `PRICE_MAX`, `PRICE_STEP`       |

**Rules:**

1. Include units in the name when multiple units are plausible (`*_MS`, `*_SECONDS`, `*_DAYS`)
2. Omit units when obvious from context (`MAX_BIO_LENGTH` = characters, `MAX_AVATAR_SIZE` = bytes with inline comment)
3. Use domain prefix when the constant could be ambiguous at the import site
4. Group related constants in the same file — the file name provides additional context

### Enums: `PascalCase` Companion Objects

- Companion object name: `PascalCase` (e.g., `RoomStatus`, `Gender`)
- Values: `snake_case` (e.g., `"student_house"`, `"prefer_not_to_say"`)
- Type alias: Same name as companion object (TypeScript merging)
- Transition maps: `VALID_*_TRANSITIONS` (SCREAMING_SNAKE_CASE)
- Guard functions: `isValid*Transition()`, `isTerminal*Status()` (camelCase)

## When to Add Here vs. Keep Local

**Add to shared:**

- Used by 2+ packages (web + mobile, database + web, etc.)
- Domain constants (storage buckets, enum values, validation limits)
- Values that must stay in sync across the monorepo

**Keep local:**

- UI-specific values (sidebar width, animation duration, marquee threshold)
- Implementation details (IndexedDB names, database names)
- Platform-specific config (mobile storage prefixes, Expo constants)
- Component internals (shadcn component defaults)

## Enum Companion Object Pattern

`defineEnum()` creates a companion object where each value is also a property:

```ts
import {defineEnum} from "./define-enum";

export const RoomStatus = defineEnum(["draft", "active", "paused", "closed"] as const);
export type RoomStatus = (typeof RoomStatus.values)[number];

// Usage:
RoomStatus.active; // "active" (type-safe property access)
RoomStatus.values; // readonly ["draft", "active", "paused", "closed"]
```

Always use companion objects — never hardcode string literals:

```ts
// CORRECT
if (room.status === RoomStatus.active) { ...
}

// WRONG
if (room.status === "active") { ...
}
```

## State Machine Transitions

Define valid transitions as a `Record` and provide a guard function:

```ts
export const VALID_ROOM_TRANSITIONS: Record<RoomStatus, readonly RoomStatus[]> = {
    draft: ["active"],
    active: ["paused", "closed"],
    paused: ["active", "closed"],
    closed: [],
};

export function isValidRoomTransition(from: RoomStatus, to: RoomStatus): boolean {
    return VALID_ROOM_TRANSITIONS[from]?.includes(to) ?? false;
}
```

## Contributing

After any changes to this package:

```bash
pnpm lint && pnpm typecheck
```

- Run `pnpm test` to verify enum tests pass
- Check that all consumers still compile: `pnpm typecheck` from repo root
