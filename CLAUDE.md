# CLAUDE.md — OpenHospi

## What is OpenHospi?

OpenHospi is a free, open-source student housing/roommate platform for the Netherlands. SURFconext is the only login method — every user is a verified student. No paywalls, no premium, E2EE chat, full privacy.

## Tech Stack

- **Monorepo:** pnpm workspaces (`apps/web`, `apps/mobile`, `packages/*`)
- **Web:** Next.js 16 (Turbopack) + React 19 + Tailwind CSS v4 (oklch) + shadcn/ui + next-intl
- **Mobile:** Expo SDK 55+ (planned, not yet started)
- **Auth:** Better Auth + @better-auth/sso (SURFconext OIDC)
- **Database:** Neon PostgreSQL (serverless) + Drizzle ORM
- **Storage:** Vercel Blob
- **i18n:** next-intl v4 — NL (default), EN, DE

## Coding Philosophy

### Quality over speed
This is a greenfield project. We do it right the first time. No quick fixes, no hacks, no "we'll clean this up later." If something isn't right, rewrite it properly.

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
- When something fails, understand WHY it fails before attempting a fix
- Check official documentation for the tools/libraries involved
- Study existing codebase patterns to understand how similar problems were already solved
- Scope changes precisely — only modify files that actually need changes
- Prefer ORM features and library tools over raw SQL or manual workarounds

## Project Conventions

### Next.js 16
- `proxy.ts` (not `middleware.ts`) — Next.js 16 renamed middleware to proxy, export named `proxy`
- Shared constants from `@openhospi/shared/constants`: `SUPPORTED_LOCALES`, `DEFAULT_LOCALE`, `APP_NAME`
- Auth client at `src/lib/auth-client.ts`
- Tailwind v4 with `@theme inline` block, oklch color space

### File structure (apps/web)
- `src/components/ui/` — shadcn/ui components (don't modify unless necessary)
- `src/components/marketing/` — custom marketing components
- `src/i18n/` — internationalization config
- `src/messages/` — translation JSON files (nl.json, en.json, de.json)

### Linting & Formatting
- ESLint 9 flat config with strict a11y, import ordering, security, and code quality plugins
- Prettier for formatting (separate from ESLint)
- Run `pnpm lint` and `pnpm format:check` before committing

### Database & Drizzle ORM
- Schema: `packages/database/src/schema/` — camelCase JS keys, snake_case DB columns
- Validators: Derived from Drizzle tables via `createInsertSchema` from `drizzle-orm/zod`
- Types: `InferSelectModel`/`InferInsertModel` — single source of truth
- Connection: Lazy proxy in `packages/database/src/db.ts` (defers until first use — required for Next.js build)

#### RLS (Row-Level Security) policies
- Use `authUid(column)` and `crudPolicy()` from `drizzle-orm/neon` for simple ownership checks
- Use `pgPolicy` with raw `sql` only for complex conditions (subqueries, joins, multi-table checks)
- **Don't use `eq()` in policy expressions** — it generates `$1` parameter placeholders in migration SQL, which policies can't use. Use raw `sql` with string literals instead (e.g. `` sql`${table.status} = 'active'` ``)
- `auth.user_id()` returns `text` but ID columns are `uuid` — custom `=(text, uuid)` and `=(uuid, text)` operators are installed in the DB to bridge this. `authUid()` works because of these operators.
- Neon Data API (not Neon Authorize) provides the `auth.user_id()` function via `pg_session_jwt`. The `auth` schema is managed by Neon — don't modify it.
- `withRLS(userId, fn)` in `packages/database/src/rls.ts` wraps queries in RLS-enforced transactions — sets `request.jwt.claims` and switches to `authenticated` role
- Better Auth provisioning and admin operations use `db` directly (owner role, bypasses RLS)

#### Migrations & commands
- Run pnpm scripts from the **repo root**: `pnpm db:generate`, `pnpm db:migrate`
- **NEVER use `db:push`** — it has a known bug with Neon RLS policies. Always use `db:generate` + `db:migrate`
- `db:generate` creates new migration files (diffs) — never delete existing migration files
- `db:generate` is interactive when renaming/creating policies — it prompts for choices
- `drizzle.config.ts` has `schemaFilter: ["public"]` — Neon's `auth` schema is managed by Neon, not Drizzle

### Git
- Branch from `dev`, PR into `dev`, merge `dev` into `main` for releases
- Write clear, descriptive commit messages
- **NEVER auto-commit or auto-push.** All code is reviewed and committed manually by the developer. AI tools must never run `git commit`, `git push`, or create PRs without explicit instruction.

## Don'ts

- Don't add features or refactor beyond what was asked
- Don't add docstrings/comments/type annotations to unchanged code
- Don't create wrapper functions, utilities, or abstractions for one-time operations
- Don't add error handling for scenarios that can't happen
- Don't use feature flags or backwards-compatibility shims when you can just change the code
- Don't leave TODO comments — either fix it now or create an issue
- Don't install new dependencies without good reason — check if existing deps or built-in APIs solve the problem first
- Don't use `db:push` for database changes — use `db:generate` + `db:migrate`
- Don't replace ORM features with raw SQL workarounds — investigate the root cause instead
- Don't use `eq()` in RLS policy expressions — use raw `sql` with string literals to avoid `$1` placeholder bugs
- Don't touch working code outside the scope of what was asked
