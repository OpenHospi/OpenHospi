---
name: drizzle-rls
description: Drizzle ORM and Supabase RLS conventions for OpenHospi. Use when working with database schema, RLS policies, queries, or running db:push.
---

# Drizzle ORM & Supabase RLS Conventions

## Schema Location

All schema files live in `packages/database/src/schema/`. Use camelCase for JS keys, snake_case for DB columns.

## RLS Policy Rules

### Imports

```ts
import { authUid, authenticatedRole, anonRole } from "drizzle-orm/supabase";
import { sql } from "drizzle-orm";
import { pgPolicy } from "drizzle-orm/pg-core";
```

### `authUid` is a raw SQL fragment

`authUid` resolves to `auth.uid()` in SQL. Use it directly in template literals:

```ts
// CORRECT
pgPolicy("users_select_own", {
  for: "select",
  to: authenticatedRole,
  using: sql`${users.id} = ${authUid}`,
});

// WRONG - never use eq() in policies
pgPolicy("users_select_own", {
  for: "select",
  to: authenticatedRole,
  using: eq(users.id, authUid), // BUG: generates $1 placeholder
});
```

### Always use explicit `pgPolicy()` calls

Never use `crudPolicy()`. Define each policy individually (select, insert, update, delete).

### Enum values in policies

Use `sql.raw()` to inline enum companion object values:

```ts
// CORRECT
using: sql`${rooms.status} = ${sql.raw(`'${RoomStatus.active}'`)}`,

// WRONG - hardcoded string
    using
:
sql`${rooms.status} = 'active'`,
```

### Complex conditions

Use raw `sql` for subqueries, joins, and multi-table checks:

```ts
pgPolicy("members_select", {
  for: "select",
  to: authenticatedRole,
  using: sql`EXISTS (
    SELECT 1 FROM ${roomMembers}
    WHERE ${roomMembers.roomId} = ${rooms.id}
    AND ${roomMembers.userId} = ${authUid}
  )`,
});
```

## Query Patterns

### RLS-enforced queries

Use `withRLS(userId, fn)` (exported from `@openhospi/database`):

```ts
import { withRLS } from "@openhospi/database";

const rooms = await withRLS(userId, (tx) => tx.select().from(rooms).where(/* ... */));
```

For query-builder reads with nested relations use RQBv2:

```ts
const room = await withRLS(userId, (tx) =>
  tx.query.rooms.findFirst({
    where: { id: roomId, ownerId: userId },
    with: { photos: { orderBy: { slot: "asc" } } },
  }),
);
```

### Admin / Better Auth operations

Use `db` directly (postgres role, bypasses RLS):

```ts
import { db } from "@openhospi/database";

await db.insert(users).values({
  /* ... */
});
```

## Schema Workflow

- **Always use `pnpm db:push`** from the repo root — pushes schema directly to the database
- **Never use** `db:generate` or `db:migrate`
- `drizzle.config.ts` has `schemaFilter: ["public"]` and `entities.roles.provider: "supabase"`

## Types & Validators

- Types: `InferSelectModel<typeof table>` / `InferInsertModel<typeof table>` — canonical source for row shapes
- Validators: hand-rolled Zod schemas in `@openhospi/validators` (stricter than DB: charlen caps, coord bounds, postal regex, cross-field refinements, `z.coerce.number()` for HTML inputs). We intentionally do NOT use `drizzle-orm/zod` / `createInsertSchema` — the DB-derived schema is too loose for UI validation.
- Connection: Lazy proxy in `packages/database/src/index.ts` — `db` defers `drizzle()` until first property access (required for Next.js build). RLS version is `createDrizzleSupabaseClient(userId)` / `withRLS(userId, fn)`.

## Common Gotchas

1. **`numeric` money columns use `mode: "number"`** — already set on `rooms.rentPrice` / `deposit` / `serviceCosts` / `estimatedUtilitiesCosts` / `totalCost`. New money columns should follow the same pattern. No `Number(...)` wrappers needed at call sites.
2. **`auth` schema is managed by Supabase** — never modify it
3. **`prepare: false`** is required in the postgres.js driver config (pgbouncer transaction pool)
4. **Don't create constants aliasing enum values** — use `RoomStatus.draft`, not `DEFAULT_STATUS = "draft"`
5. **RLS role allow-list** — `createDrizzleSupabaseClient` only switches to roles in `ALLOWED_SUPABASE_ROLES` (anon, authenticated, service_role, postgres). Adding a new role requires updating that set.
