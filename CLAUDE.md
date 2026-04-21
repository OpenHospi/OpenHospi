# CLAUDE.md — OpenHospi

See @package.json for available scripts and @README.md for project overview.

## What is OpenHospi?

OpenHospi is a free, open-source platform where students in the Netherlands find and list rooms/roommates. InAcademia is the only login method — every user is a verified student. No paywalls, no premium, E2EE chat, full privacy.

## Tech Stack

- **Monorepo:** pnpm workspaces (`apps/web`, `apps/mobile`, `packages/*`)
- **Web:** Next.js 16 (Turbopack) + React 19 + Tailwind CSS v4 (oklch) + shadcn/ui + next-intl
- **Mobile:** Expo SDK 55+ (planned, not yet started)
- **Auth:** Better Auth + genericOAuth (InAcademia OIDC)
- **Database:** Supabase PostgreSQL + Drizzle ORM
- **Storage:** Supabase Storage (profile-photos, room-photos buckets)
- **i18n:** next-intl v4 — NL (default), EN, DE

## Coding Philosophy

### Quality over speed

IMPORTANT: This is a greenfield project. We do it right the first time. No quick fixes, no hacks, no "we'll clean this up later." If something isn't right, rewrite it properly. When fixing a bug or implementing a feature, understand the full context and rewrite the affected code properly. Don't patch around the problem with minimal changes. If a file or function needs changes in multiple places, rewrite it as a whole rather than making scattered minimal edits.

### No premature optimization

Write clear, straightforward code first. Don't create abstractions "just in case." Don't split into helper functions unless there's actual reuse. Three similar lines are better than a premature abstraction. Optimize only when there's a measured problem.

### Keep it simple and maintainable

- Prefer flat, readable code over clever patterns
- Avoid deep function-to-function chains — they make debugging hard
- Don't over-abstract. If a function is only called once and isn't complex, inline it
- Every file should be understandable on its own without jumping through 5 layers of indirection

### Write code for humans

- Clear variable and function names over comments
- Only add comments when the "why" isn't obvious from the code
- Prefer explicit over implicit — make intent clear

### Investigate before fixing

IMPORTANT: Read the full file before making changes. Understand the complete flow, not just the line that errors.

- When something fails, understand WHY it fails before attempting a fix
- Check official documentation for the tools/libraries involved
- Study existing codebase patterns to understand how similar problems were already solved
- Scope changes precisely — only modify files that actually need changes
- Prefer ORM features and library tools over raw SQL or manual workarounds

## Project Conventions

### Next.js 16

- `proxy.ts` (not `middleware.ts`) — Next.js 16 renamed middleware to proxy, export named `proxy`
- Locale constants from `@openhospi/i18n`: `SUPPORTED_LOCALES`, `DEFAULT_LOCALE`, `LOCALE_CONFIG`, `localePathPattern`, type `Locale`
- App constants from `@openhospi/shared/constants`: `APP_NAME`, `BRAND_COLOR`, etc.
- Auth client at `src/lib/auth-client.ts`
- Tailwind v4 with `@theme inline` block, oklch color space

### Enums & shared types

- All enums live in `packages/shared/src/enums.ts` — arrays (`ROOM_STATUSES`) + types (`RoomStatus`) + companion objects (`RoomStatus.active`)
- Always use companion objects for enum values — never hardcode string literals (e.g. use `RoomStatus.active` not `"active"`)
- In RLS policies, use `sql.raw(RoomStatus.active)` to inline enum values into raw SQL
- Config constants (limits, lengths, page sizes) belong in `constants.ts` — enum values do NOT

### File structure (apps/web)

- `src/components/ui/` — shadcn/ui components (don't modify unless necessary)
- `src/components/marketing/` — custom marketing components
- `src/i18n/` — internationalization config
- `src/messages/` — translation JSON files (see i18n section below)

### i18n (next-intl)

- Translation files: `packages/i18n/messages/{nl,en,de}/{shared,web,admin,app}.json`
- `shared.json` — Keys used by BOTH web and mobile: common, enums, notifications, auth, app screens
- `web.json` — Web-only: marketing pages (home, about, safety, costs, etc.) and public SEO pages
- `admin.json` — Admin dashboard (web-only)
- `app.json` — Mobile-only keys (currently empty, will grow with mobile app)
- Loading: `@openhospi/i18n/web` merges shared + web + admin; `@openhospi/i18n/app` merges shared + app
- **ZERO duplication rule**: If a label (cancel, save, next, back, etc.) is used across 2+ features, it goes in `common.labels` — never repeated per feature namespace
- Use `useTranslations("common.labels")` / `getTranslations("common.labels")` alongside feature translations for shared labels
- Feature-specific text stays in its own namespace (e.g. `admin.reports`, `app.rooms`)
- Before adding a new translation key, check if the same label already exists in `common.labels` or another namespace

### Linting & Formatting

- ESLint 9 flat config with strict a11y, import ordering, security, and code quality plugins
- Prettier for formatting (separate from ESLint)
- Run `pnpm lint` and `pnpm format:check` before committing

### Database & Drizzle ORM

- Version: `drizzle-orm@1.0.0-beta.22` (pinned in `pnpm-workspace.yaml` catalog, uniform across monorepo)
- Schema: `packages/database/src/schema/` — camelCase JS keys, snake_case DB columns
- Relations (RQBv2): `packages/database/src/schema/relations.ts` — single `defineRelations()` call, passed to `drizzle({ relations })`. Use `tx.query.<table>.findFirst/findMany({ where: {...}, with: {...} })` for nested reads
- Types: `InferSelectModel`/`InferInsertModel` — canonical source for row shapes
- Validators: `@openhospi/validators` — hand-rolled Zod schemas with UI-grade constraints (charlen caps, coord bounds, postal regex, cross-field refinements, `z.coerce.number()` for HTML inputs). We deliberately do NOT use `drizzle-orm/zod` / `createInsertSchema` — the DB-derived schema is too loose for the form layer
- Money columns: use `numeric(..., { mode: "number" })` so JS gets `number`, not `string` — precision 7 scale 2 is exact under IEEE 754 for our rent ranges. No manual `Number(...)` wrapping at call sites
- Connection: Lazy proxy in `packages/database/src/index.ts` — `db` defers `drizzle()` until first property access (required for Next.js build). Client uses `{ connection: { url, prepare: false } }` form so drizzle owns the postgres.js client

#### RLS (Row-Level Security) policies

- Use `authUid`, `authenticatedRole`, `anonRole` from `drizzle-orm/supabase` with explicit `pgPolicy()` calls (no `crudPolicy()`)
- `authUid` is a raw SQL fragment — use it as `` sql`${column} = ${authUid}` `` in policy expressions
- Use `pgPolicy` with raw `sql` for complex conditions (subqueries, joins, multi-table checks)
- **Don't use `eq()` in policy expressions** — use raw `sql` with string literals to avoid `$1` placeholder bugs
- `auth.uid()` is the Supabase function for the current user ID. The `auth` schema is managed by Supabase — don't modify it
- RLS bootstrap: `createDrizzleSupabaseClient(userId)` returns `{ admin, rls(fn) }`. The `rls` transaction sets `request.jwt.claims` via a parameterised `sql` template and switches roles via `sql.identifier(role)` after validating against an allow-list (`anon`, `authenticated`, `service_role`, `postgres`)
- `withRLS(userId, fn)` in `packages/database/src/rls.ts` (re-exported from `@openhospi/database`) is the canonical helper for RLS-enforced transactions
- Better Auth provisioning and admin operations use `db` directly (postgres role, bypasses RLS)

#### Schema commands

- Run pnpm scripts from the **repo root**: `pnpm db:push`
- `db:push` is the standard workflow — pushes schema directly to the database (no migration files)
- `pnpm db:check` runs `drizzle-kit check` for migration DAG commutativity (use before generating migrations if we ever leave db:push)
- `drizzle.config.ts` has `schemaFilter: ["public"]` and `entities.roles.provider: "supabase"`

### Git

- Branch from `dev`, PR into `dev`, merge `dev` into `main` for releases
- Write clear, descriptive commit messages
- **NEVER auto-commit or auto-push.** All code is reviewed and committed manually by the developer. AI tools must never run `git commit`, `git push`, or create PRs without explicit instruction.

### Verification

- After code changes: `pnpm lint && pnpm format:check`
- After schema changes: `pnpm db:push`
- After adding dependencies: `pnpm install` from repo root
- Typecheck: `pnpm typecheck`
- Always verify changes compile and pass linting before considering a task done

## Don'ts

- Don't add features, refactor, or touch working code beyond what was asked
- Don't add docstrings/comments/type annotations to unchanged code
- Don't leave TODO comments — either fix it now or create an issue
- Don't install new dependencies without good reason — check if existing deps or built-in APIs solve the problem first
- Don't use `db:generate` or `db:migrate` — use `db:push` for all schema changes
- Don't use `eq()` in RLS policy expressions — use raw `sql` with string literals to avoid `$1` placeholder bugs
- Don't use hardcoded enum string literals — use companion objects from `@openhospi/shared/enums`
- Don't duplicate translation keys — reusable labels go in `common.labels` in `shared.json`, not repeated per namespace
- Don't replace ORM features with raw SQL workarounds — investigate the root cause instead
- Don't use em dashes ("—") in Dutch or English content. In Dutch this punctuation is unnatural and reads as AI-generated. Use colons (:), commas, periods, or rewrite as separate sentences. Match the style of existing translations and legal pages: direct, short sentences, fragment sentences for emphasis ("Geen verborgen kosten."), and "en"/"of" to join clauses
