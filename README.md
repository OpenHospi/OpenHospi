<p align="center">
    <img src="./packages/shared/assets/logo.svg" height="128" alt="OpenHospi logo">
</p>

<h1 align="center">OpenHospi</h1>

<p align="center">
  Find a room or roommate in the Netherlands — free, open-source, and student-verified.
</p>

<p align="center">
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-AGPL--3.0-blue" alt="License: AGPL-3.0"></a>
  <a href="https://github.com/OpenHospi/OpenHospi/stargazers"><img src="https://img.shields.io/github/stars/OpenHospi/OpenHospi" alt="GitHub stars"></a>
  <a href="https://github.com/OpenHospi/OpenHospi/issues"><img src="https://img.shields.io/github/issues/OpenHospi/OpenHospi" alt="GitHub issues"></a>
  <a href="https://github.com/OpenHospi/OpenHospi/pulls"><img src="https://img.shields.io/badge/PRs-welcome-brightgreen" alt="PRs Welcome"></a>
  <a title="Crowdin" target="_blank" href="https://crowdin.com/project/openhospi"><img src="https://badges.crowdin.net/openhospi/localized.svg" alt="Crowdin"></a>
  <a href="https://opencollective.com/openhospi"><img src="https://opencollective.com/openhospi/all/badge.svg?label=Financial+Contributors" alt="Open Collective"></a>
</p>

---

## About

OpenHospi is a free, open-source student housing platform built for the Netherlands. Authentication is handled
exclusively through InAcademia, ensuring every user is a verified student at a Dutch institution. No paywalls, no
middlemen — just a clean platform with end-to-end encrypted chat and full transparency through open source.

## Tech Stack

| Layer      | Web                               | Mobile                              |
| ---------- | --------------------------------- | ----------------------------------- |
| Framework  | Next.js 16, React 19              | Expo SDK 55, React Native 0.83      |
| Styling    | Tailwind CSS 4, shadcn/ui         | Uniwind v1.5 (Tailwind v4 for RN)   |
| Database   | Supabase PostgreSQL + Drizzle ORM | Local SQLite + Drizzle ORM (cache)  |
| Auth       | Better Auth + InAcademia OIDC     | Better Auth Expo + InAcademia OIDC  |
| Realtime   | Supabase Realtime (WebSocket)     | Supabase Realtime (WebSocket)       |
| Storage    | Supabase Storage                  | expo-secure-store, expo-file-system |
| Data       | Server Actions                    | REST API + React Query              |
| Hosting    | Vercel                            | EAS Build + EAS Update              |
| Monitoring | Sentry (EU, no PII)               | Sentry (EU, no PII)                 |
| Monorepo   | pnpm workspaces                   | pnpm workspaces                     |

## Getting Started

Requires [Docker Desktop](https://www.docker.com/products/docker-desktop/), [Node.js 24+](https://nodejs.org/), [pnpm 9+](https://pnpm.io/),
and the [Supabase CLI](https://supabase.com/docs/guides/local-development/cli/getting-started).

```bash
git clone https://github.com/OpenHospi/OpenHospi.git
cd OpenHospi
pnpm setup
```

The setup script checks prerequisites, installs dependencies, starts the local Supabase stack, creates `.env.local` with
the correct keys, and seeds the database. Once done, start the dev server with `pnpm dev:web`.

See [CONTRIBUTING.md](CONTRIBUTING.md) for the full list of scripts, architecture details, and troubleshooting.

## License

[AGPL-3.0](LICENSE) — Ruben Talstra

---

<a href="https://crowdin.com/project/openhospi">
  <img src=".github/localization-at-white-rounded-bordered@1x.svg" alt="Crowdin | Agile localization for tech companies">
</a>
