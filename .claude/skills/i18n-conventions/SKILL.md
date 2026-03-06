---
name: i18n-conventions
description: next-intl translation conventions for OpenHospi. Use when adding or modifying translation keys, creating new pages, or working with internationalization.
---

# i18n Conventions (next-intl)

## File Locations

Translation files live in `packages/i18n/messages/{nl,en,de}/`:

| File          | Scope                                           | Used by      |
|---------------|-------------------------------------------------|--------------|
| `shared.json` | common, enums, notifications, auth, app screens | Web + Mobile |
| `web.json`    | Marketing pages, public SEO pages               | Web only     |
| `admin.json`  | Admin dashboard                                 | Web only     |
| `app.json`    | Mobile-only keys                                | Mobile only  |

## Loading

- `@openhospi/i18n/web` merges: shared + web + admin
- `@openhospi/i18n/app` merges: shared + app

## Which Keys Go Where

- **Shared by web and mobile?** -> `shared.json`
- **Marketing / public SEO page?** -> `web.json`
- **Admin dashboard?** -> `admin.json`
- **Mobile-only screen?** -> `app.json`
- **Reusable label (cancel, save, next, back, etc.)?** -> `common.labels` in `shared.json`

## Zero-Duplication Rule

If a label is used across 2+ features, it MUST go in `common.labels` in `shared.json`. Never duplicate labels per
feature namespace.

### Using shared labels alongside feature translations

```tsx
// Server component
const tCommon = await getTranslations("common.labels");
const t = await getTranslations("admin.reports");

// Client component
const tCommon = useTranslations("common.labels");
const t = useTranslations("admin.reports");

// Usage
<Button>{tCommon("cancel")}</Button>
<h1>{t("title")}</h1>
```

## Checklist for Adding New Keys

1. **Check `common.labels` first** — does the label already exist?
2. **Check other namespaces** — is there an equivalent key elsewhere?
3. **Add to the correct file** based on scope (shared/web/admin/app)
4. **Add in ALL 3 languages** — nl, en, de (nl is the default locale)
5. **Use feature namespaces** for feature-specific text (e.g. `admin.reports.title`)
6. **Never hardcode user-facing strings** — always use translation keys

## Namespace Conventions

- Top-level keys in each JSON file map to feature areas
- Use dot notation: `useTranslations("feature.section")`
- Keep nesting shallow (max 3 levels recommended)