#!/usr/bin/env bash
set -euo pipefail

# ─────────────────────────────────────────────────────────────────────────────
# OpenHospi — Local Development Setup
# ─────────────────────────────────────────────────────────────────────────────
# Checks prerequisites, installs dependencies, starts Supabase, creates
# .env.local, pushes the schema, seeds the database, and starts the dev server.
# ─────────────────────────────────────────────────────────────────────────────

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m'

info()  { printf "${CYAN}▸${NC} %s\n" "$1"; }
ok()    { printf "${GREEN}✔${NC} %s\n" "$1"; }
warn()  { printf "${YELLOW}⚠${NC} %s\n" "$1"; }
fail()  { printf "${RED}✖ %s${NC}\n" "$1" >&2; exit 1; }

# ── Prerequisites ────────────────────────────────────────────────────────────

printf "\n${BOLD}Checking prerequisites…${NC}\n\n"

# Docker
if ! command -v docker &>/dev/null; then
  fail "Docker is not installed. Install Docker Desktop: https://www.docker.com/products/docker-desktop/"
fi
if ! docker info &>/dev/null; then
  fail "Docker daemon is not running. Start Docker Desktop and try again."
fi
ok "Docker"

# Node.js
if ! command -v node &>/dev/null; then
  fail "Node.js is not installed. Install v24+: https://nodejs.org/"
fi
NODE_MAJOR=$(node -v | sed 's/v\([0-9]*\).*/\1/')
if [ "$NODE_MAJOR" -lt 24 ]; then
  fail "Node.js v24+ required (found $(node -v)). Update: https://nodejs.org/"
fi
ok "Node.js $(node -v)"

# pnpm
if ! command -v pnpm &>/dev/null; then
  fail "pnpm is not installed. Install: https://pnpm.io/installation"
fi
ok "pnpm $(pnpm -v)"

# Supabase CLI
if ! command -v supabase &>/dev/null; then
  fail "Supabase CLI is not installed. Install: https://supabase.com/docs/guides/local-development/cli/getting-started"
fi
ok "Supabase CLI $(supabase -v 2>/dev/null | head -1)"

# ── Install dependencies ────────────────────────────────────────────────────

printf "\n${BOLD}Installing dependencies…${NC}\n\n"
pnpm install
ok "Dependencies installed"

# ── Start Supabase ──────────────────────────────────────────────────────────

printf "\n${BOLD}Starting Supabase…${NC}\n\n"

if supabase status &>/dev/null; then
  warn "Supabase is already running — skipping start"
else
  supabase start
fi
ok "Supabase is running"

# ── Create .env.local ───────────────────────────────────────────────────────

printf "\n${BOLD}Setting up environment…${NC}\n\n"

if [ -f .env.local ]; then
  warn ".env.local already exists — skipping (delete it to regenerate)"
else
  # Extract keys from supabase status
  ANON_KEY=$(supabase status --output json | grep -o '"anon_key":"[^"]*"' | cut -d'"' -f4)
  SERVICE_ROLE_KEY=$(supabase status --output json | grep -o '"service_role_key":"[^"]*"' | cut -d'"' -f4)

  if [ -z "$ANON_KEY" ] || [ -z "$SERVICE_ROLE_KEY" ]; then
    warn "Could not auto-extract Supabase keys. Copying .env.example — fill in keys manually."
    cp .env.example .env.local
  else
    cp .env.example .env.local
    # Replace placeholder values with actual local keys
    sed -i.bak "s|<from supabase status or Supabase dashboard>|$ANON_KEY|" .env.local
    # The service role key placeholder is the same text — replace the second occurrence
    sed -i.bak "0,/SUPABASE_SERVICE_ROLE_KEY=.*/s|SUPABASE_SERVICE_ROLE_KEY=.*|SUPABASE_SERVICE_ROLE_KEY=$SERVICE_ROLE_KEY|" .env.local
    rm -f .env.local.bak
    ok "Created .env.local with local Supabase keys"
  fi

  info "Generate remaining secrets:"
  printf "  ${CYAN}BETTER_AUTH_SECRET${NC}:  openssl rand -base64 32\n"
  printf "  ${CYAN}VAPID keys${NC}:          npx web-push generate-vapid-keys\n"
  printf "  ${CYAN}CRON_SECRET${NC}:         openssl rand -base64 32\n\n"
fi

# ── Push schema & seed ──────────────────────────────────────────────────────

printf "\n${BOLD}Setting up database…${NC}\n\n"
pnpm supabase:reset
ok "Database schema pushed, storage configured, and seed data loaded"

# ── Done ────────────────────────────────────────────────────────────────────

printf "\n${GREEN}${BOLD}Setup complete!${NC}\n\n"
printf "  Start the dev server:    ${CYAN}pnpm dev${NC}\n"
printf "  App:                     ${CYAN}http://localhost:3000${NC}\n"
printf "  Supabase Studio:         ${CYAN}http://127.0.0.1:54323${NC}\n"
printf "  Mailpit (email testing): ${CYAN}http://127.0.0.1:54324${NC}\n\n"
