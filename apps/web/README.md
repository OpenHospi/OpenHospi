# @openhospi/web

The Next.js 16 web application for OpenHospi.

## Tech Stack

- **Framework:** Next.js 16 (Turbopack) + React 19
- **Styling:** Tailwind CSS v4 (oklch) + shadcn/ui
- **Auth:** Better Auth + SURFconext SSO (Drizzle adapter)
- **Database:** Neon PostgreSQL via Drizzle ORM (from `@openhospi/database`)
- **Storage:** Vercel Blob (photo uploads)
- **i18n:** next-intl v4 — NL (default), EN, DE

## Getting Started

```bash
# From the monorepo root
pnpm dev --filter @openhospi/web
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Key Paths

- `src/lib/auth.ts` — Better Auth server config
- `src/lib/auth-client.ts` — Better Auth client
- `src/components/ui/` — shadcn/ui components
- `src/components/marketing/` — Marketing page components
- `src/components/app/` — App shell components
- `src/proxy.ts` — Next.js 16 proxy (locale detection)
