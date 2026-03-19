# Contributing to OpenHospi

Thanks for your interest in contributing! This guide covers local development setup, available scripts, and
troubleshooting.

## Local Development

### Prerequisites

| Tool           | Version | Install                                                                                |
| -------------- | ------- | -------------------------------------------------------------------------------------- |
| Docker Desktop | Latest  | [docker.com](https://www.docker.com/products/docker-desktop/)                          |
| Node.js        | 24+     | [nodejs.org](https://nodejs.org/)                                                      |
| pnpm           | 9+      | [pnpm.io](https://pnpm.io/installation)                                                |
| Supabase CLI   | Latest  | [supabase.com](https://supabase.com/docs/guides/local-development/cli/getting-started) |

### Automated setup

The setup script checks prerequisites, installs dependencies, starts Supabase, creates `.env.local` with the correct
keys, and seeds the database:

```bash
git clone https://github.com/OpenHospi/OpenHospi.git
cd OpenHospi
pnpm setup
```

### Manual setup

If you prefer to run each step yourself:

```bash
# 1. Install dependencies
pnpm install

# 2. Start the local Supabase stack
pnpm supabase:start

# 3. Create .env.local from the template
cp .env.example .env.local
# Fill in NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY and SUPABASE_SECRET_KEY
# from the output of: pnpm supabase:status

# 4. Push schema, set up storage, and seed the database
pnpm supabase:reset

# 5. Start the dev server
pnpm dev:web
```

### Local URLs

| Service                 | URL                    |
| ----------------------- | ---------------------- |
| App                     | http://localhost:3000  |
| Supabase Studio         | http://127.0.0.1:54323 |
| Supabase API            | http://127.0.0.1:54321 |
| Mailpit (email testing) | http://127.0.0.1:54324 |

## Available Scripts

### Development

| Script              | Description                    |
| ------------------- | ------------------------------ |
| `pnpm dev:web`      | Start the Next.js dev server   |
| `pnpm build:web`    | Production build               |
| `pnpm lint`         | Run ESLint across all packages |
| `pnpm lint:fix`     | Auto-fix lint errors           |
| `pnpm format:check` | Check Prettier formatting      |
| `pnpm format:write` | Auto-fix formatting            |
| `pnpm typecheck`    | TypeScript type checking       |
| `pnpm i18n:check`   | Check translation completeness |

### Supabase

| Script                 | Description                                   |
| ---------------------- | --------------------------------------------- |
| `pnpm supabase:start`  | Start local Supabase (Docker)                 |
| `pnpm supabase:stop`   | Stop local Supabase                           |
| `pnpm supabase:status` | Show local URLs and keys                      |
| `pnpm supabase:reset`  | Reset DB + push schema + setup storage + seed |

### Database

| Script                        | Description                            |
| ----------------------------- | -------------------------------------- |
| `pnpm db:push`                | Push Drizzle schema to remote Supabase |
| `pnpm db:push:local`          | Push Drizzle schema to local Supabase  |
| `pnpm db:studio`              | Open Drizzle Studio (remote)           |
| `pnpm db:studio:local`        | Open Drizzle Studio (local)            |
| `pnpm db:seed:local`          | Seed local database with test data     |
| `pnpm db:setup:storage:local` | Set up storage bucket policies locally |

### Mobile (Expo)

| Script                    | Description             |
| ------------------------- | ----------------------- |
| `pnpm dev:mobile`         | Start Expo dev server   |
| `pnpm dev:mobile:ios`     | Run on iOS simulator    |
| `pnpm dev:mobile:android` | Run on Android emulator |

## Architecture

Local Supabase runs 12 Docker containers managed entirely by the Supabase CLI — no custom `docker-compose.yml` is
needed:

- **postgres** — PostgreSQL 17
- **postgrest** — REST API
- **gotrue** — Auth server
- **kong** — API gateway
- **realtime** — WebSocket server
- **storage** — File storage (S3-compatible)
- **studio** — Dashboard UI
- **mailpit** — Email testing
- **edge-runtime** — Deno Edge Functions
- **pg_meta** — Database metadata API
- **vector** — Log collection
- **analytics** — Usage analytics

## Troubleshooting

### Supabase containers won't start

Make sure Docker Desktop is running. If containers are in a bad state:

```bash
pnpm supabase:stop
pnpm supabase:start
```

For a full container cleanup:

```bash
docker rm -f $(docker ps -aq --filter "label=com.supabase.cli.project=OpenHospi")
pnpm supabase:start
```

### Port conflicts

Local Supabase uses ports **54321–54327** and **8083**. If another service occupies these ports, stop it or update the
ports in `supabase/config.toml`.

### Schema push fails

Verify Supabase is running, then retry:

```bash
pnpm supabase:status
pnpm db:push:local
```

### Missing environment variables

Run `pnpm supabase:status` to see the local API URL, anon key, and service role key. Copy them into `.env.local`.

## Workflow

1. Branch from `dev`
2. Make changes, verify with `pnpm lint && pnpm format:check && pnpm typecheck`
3. Open a PR into `dev`
4. `dev` is merged into `main` for releases
