# Mobile App UX Overhaul: Overview

## What & Why

OpenHospi's mobile app (Expo SDK 55, ~17.5K LOC) has all major features at parity with web, but the UI feels amateur, navigation is confusing, and it's buggy. Students live on their phones: if the app isn't polished, nobody will use it. This is a non-profit serving Dutch students, so the quality bar is high.

## Scope

UX-focused overhaul + backend hardening. Keep working backend integrations (crypto, auth, SQLite). Rewrite every screen and component for Airbnb-quality discovery + WhatsApp-quality chat. Fix critical bugs in the data layer.

## User Decisions

- Reference apps: Airbnb (discovery, photos, animations) + WhatsApp/Signal (chat)
- Discovery: Map + list split view (Airbnb style) using `expo-maps`
- Navigation: Keep 5 bottom tabs (Discover, My Rooms, Chat, Applications, Profile)
- Timeline: One big push (not incremental)
- All 4 UX priorities: animations, offline-first, speed, deep links
- Map privacy: Privacy radius circles (300m offset + 300m circle)

## Phase Index

| Phase                                | Name                       | Focus                                                       | Files             |
| ------------------------------------ | -------------------------- | ----------------------------------------------------------- | ----------------- |
| [1](./phase-01-backend-hardening.md) | Backend Hardening          | Fix bugs, optimize data layer, NSFWJS image moderation      | ~21 files + admin |
| [2](./phase-02-foundation.md)        | Foundation & Design System | New utilities, UI primitives, shared components             | ~45 files         |
| [3](./phase-03-navigation.md)        | Navigation Shell           | Tab bar, layouts, deep links, modal rules                   | ~4 files          |
| [4](./phase-04-discover.md)          | Discover Tab               | Photo card feed, FAB map, filters, room detail (7 sections) | ~4 files          |
| [5](./phase-05-chat.md)              | Chat Tab                   | Conversations, messages, E2EE verify (bottom sheet)         | ~4 files          |
| [6](./phase-06-my-rooms.md)          | My Rooms Tab               | Room CRUD, applicants, quick events, voting                 | ~18 files         |
| [7](./phase-07-applications.md)      | Applications Tab           | Application list, detail, binary RSVP                       | ~2 files          |
| [8](./phase-08-profile.md)           | Profile Tab                | Profile, 6 edit modals, settings, completion indicator      | ~12 files         |
| [9](./phase-09-auth-onboarding.md)   | Auth & Onboarding          | Login, 7-step onboarding with microcopy, key recovery       | ~10 files         |
| [10](./phase-10-feature-gaps.md)     | Feature Gaps               | Biometric lock screen, GDPR, share, badges, camera          | ~5 features       |
| [11](./phase-11-polish.md)           | Performance Polish         | Offline, pre-fetching, skeletons, image caching             | Cross-cutting     |

## New Dependencies

| Package                                               | Purpose                                             | Config Required                                  |
| ----------------------------------------------------- | --------------------------------------------------- | ------------------------------------------------ |
| `expo-maps`                                           | Native maps (Apple MapKit iOS, Google Maps Android) | Config plugin + Google Cloud API key for Android |
| `@gorhom/bottom-sheet` v5                             | Gesture-driven bottom sheets                        | `BottomSheetModalProvider` in root layout        |
| `@shopify/flash-list`                                 | High-performance lists with cell recycling          | None (drop-in FlatList replacement)              |
| `react-native-mmkv` v4 + `react-native-nitro-modules` | Synchronous KV store                                | `expo prebuild` required                         |
| `expo-local-authentication`                           | Biometric auth (Face ID, fingerprint)               | Config plugin for Face ID permission             |

**Server-side only (apps/web)**: `nsfwjs` + `@tensorflow/tfjs-node` -- free image moderation, ~93% accuracy, GDPR-perfect

**Shared package** (new): `packages/shared/src/pdok.ts` -- `searchCities()` utility for PDOK city search (used by web + mobile)

**Mobile** (new): `src/components/city-search.tsx` -- PDOK-powered city search component for preferred city

Already installed: expo-camera, expo-haptics, expo-image, expo-image-picker, expo-sharing, expo-glass-effect

Remove: `react-native-leaflet-view` + patch + leaflet.html asset + expo-doctor exclusion

**Delete**: `packages/shared/src/enums/cities.ts` (City enum replaced by free-text PDOK cities) + `enums.city.*` translation keys from all locales

## Execution Timeline

- **Week 1**: Backend hardening (Phase 1) + install deps + foundation utilities (Phase 2A)
- **Week 2**: Design system + shared components (Phase 2B-2F)
- **Week 3**: Core screens: Navigation + Discover + Chat (Phases 3-5)
- **Week 4**: Management screens: My Rooms + Applications (Phases 6-7)
- **Week 5**: Profile + Auth + Feature gaps + Polish (Phases 8-11)

## Keep Unchanged (do NOT touch)

```
src/lib/auth-client.ts
src/lib/splash.ts
src/lib/storage-url.ts
src/lib/theme.ts
src/lib/utils.ts
src/lib/crypto/**
src/lib/db/**
src/hooks/use-encryption.ts
src/i18n/**
src/@types/**
src/global.css
```
