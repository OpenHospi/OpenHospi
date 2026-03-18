# OpenHospi Docs — Fumadocs Implementation Plan

## Goal

Add a `apps/docs` app to the OpenHospi monorepo using **Fumadocs + Next.js**, hosted at **docs.openhospi.nl** via Vercel.

**Language setup:** Dutch is the primary language (default, no URL prefix). English is the translation. File slugs are kept in English for clean URLs.

**Audience:** End users of the platform (students looking for rooms/roommates), potential sponsors/partners. This is NOT developer documentation — contributor docs live in the repo itself (`CONTRIBUTING.md`, `GOVERNANCE.md`, etc.).

---

## Phase 1: Scaffold & Monorepo Integration

### 1.1 — Create the Fumadocs App

From the repo root, scaffold into `apps/docs`:

```bash
cd apps
pnpm create fumadocs-app docs
# Select: Next.js + Fumadocs MDX
```

This gives you a working Fumadocs app with LLM integration and OG images pre-configured.

Your `pnpm-workspace.yaml` already globs `apps/*`, so it's picked up automatically.

### 1.2 — Configure `apps/docs/package.json`

```json
{
  "name": "@openhospi/docs",
  "private": true,
  "scripts": {
    "dev": "next dev --port 3001",
    "build": "next build",
    "start": "next start",
    "lint": "next lint"
  }
}
```

Use port `3001` so it doesn't clash with `apps/web` during local dev.

### 1.3 — Root `package.json` Scripts

Add to the root `package.json`:

```json
{
  "scripts": {
    "dev:docs": "pnpm --filter @openhospi/docs dev",
    "build:docs": "pnpm --filter @openhospi/docs build"
  }
}
```

### 1.4 — Verify

```bash
pnpm install
pnpm dev:docs
# Visit http://localhost:3001/docs
```

---

## Phase 2: Content Structure (Page Conventions)

### 2.1 — Directory Layout

Fumadocs uses file-system conventions to generate the sidebar (page tree). We use the `dot` parser for i18n (locale suffixes on filenames). **Dutch is the default language** — files without a suffix are Dutch. English translations get the `.en.mdx` suffix.

Slugs are in Dutch since the primary audience is Dutch students. Both languages share the same slugs — this is a Fumadocs requirement for the language switcher to work.

```
apps/docs/
├── content/
│   └── docs/
│       ├── meta.json                         # Dutch sidebar order
│       ├── meta.en.json                      # English sidebar order
│       ├── index.mdx                         # Dutch /docs landing
│       ├── index.en.mdx                      # English /en/docs landing
│       │
│       ├── aan-de-slag/                      # Aan de slag
│       │   ├── meta.json
│       │   ├── meta.en.json
│       │   ├── index.mdx                     # Wat is OpenHospi?
│       │   ├── index.en.mdx
│       │   ├── account-aanmaken.mdx          # Account aanmaken & InAcademia verificatie
│       │   ├── account-aanmaken.en.mdx
│       │   ├── je-profiel.mdx                # Profiel instellen
│       │   └── je-profiel.en.mdx
│       │
│       ├── kamer-zoeken/                     # Kamer zoeken
│       │   ├── meta.json
│       │   ├── meta.en.json
│       │   ├── index.mdx                     # Hoe zoeken werkt
│       │   ├── index.en.mdx
│       │   ├── zoeken-en-filteren.mdx        # Zoeken & filteren
│       │   ├── zoeken-en-filteren.en.mdx
│       │   ├── reageren-op-listings.mdx      # Reageren op een listing
│       │   └── reageren-op-listings.en.mdx
│       │
│       ├── kamer-aanbieden/                  # Kamer aanbieden
│       │   ├── meta.json
│       │   ├── meta.en.json
│       │   ├── index.mdx                     # Hoe aanbieden werkt
│       │   ├── index.en.mdx
│       │   ├── listing-aanmaken.mdx          # Listing aanmaken
│       │   ├── listing-aanmaken.en.mdx
│       │   ├── listing-beheren.mdx           # Listing beheren
│       │   └── listing-beheren.en.mdx
│       │
│       ├── chat/                             # Chat & communicatie
│       │   ├── meta.json
│       │   ├── meta.en.json
│       │   ├── index.mdx                     # Hoe de chat werkt
│       │   ├── index.en.mdx
│       │   ├── berichten.mdx                 # Berichten sturen
│       │   └── berichten.en.mdx
│       │
│       ├── privacy-en-veiligheid/            # Privacy & Veiligheid
│       │   ├── meta.json
│       │   ├── meta.en.json
│       │   ├── index.mdx                     # Overzicht
│       │   ├── index.en.mdx
│       │   ├── jouw-gegevens.mdx             # Jouw gegevens (AVG/GDPR)
│       │   ├── jouw-gegevens.en.mdx
│       │   ├── veiligheidstips.mdx           # Veiligheidstips
│       │   ├── veiligheidstips.en.mdx
│       │   ├── datalekprocedure.mdx          # Datalekprocedure
│       │   └── datalekprocedure.en.mdx
│       │
│       ├── veelgestelde-vragen/              # Veelgestelde vragen
│       │   ├── meta.json
│       │   ├── meta.en.json
│       │   ├── index.mdx                     # Alle FAQ's
│       │   └── index.en.mdx
│       │
│       └── sponsors/                         # Sponsors & Partners
│           ├── meta.json
│           ├── meta.en.json
│           ├── index.mdx                     # Waarom OpenHospi steunen?
│           ├── index.en.mdx
│           ├── hoe-het-werkt.mdx             # Hoe sponsoring werkt
│           └── hoe-het-werkt.en.mdx
│
├── app/
│   └── [lang]/
│       ├── layout.tsx
│       ├── (home)/
│       │   └── page.tsx
│       └── docs/
│           ├── layout.tsx
│           └── [[...slug]]/
│               └── page.tsx
├── lib/
│   ├── source.ts
│   ├── i18n.ts
│   ├── get-llm-text.ts
│   └── layout.shared.tsx
├── components/
│   └── mdx/
│       └── mermaid.tsx
├── source.config.ts
├── next.config.ts
├── tailwind.config.ts
└── package.json
```

### 2.2 — URL Structure

| URL | Language | Content |
|-----|----------|---------|
| `docs.openhospi.nl/docs` | Dutch | Welkom / Overzicht |
| `docs.openhospi.nl/docs/aan-de-slag/account-aanmaken` | Dutch | Account aanmaken |
| `docs.openhospi.nl/docs/kamer-zoeken` | Dutch | Kamer zoeken |
| `docs.openhospi.nl/docs/veelgestelde-vragen` | Dutch | Veelgestelde vragen |
| `docs.openhospi.nl/en/docs` | English | Welcome / Overview |
| `docs.openhospi.nl/en/docs/aan-de-slag/account-aanmaken` | English | Create account |
| `docs.openhospi.nl/en/docs/kamer-zoeken` | English | Finding a room |
| `docs.openhospi.nl/en/docs/veelgestelde-vragen` | English | FAQ |

### 2.3 — Sidebar Ordering with `meta.json`

Each folder gets a `meta.json` (Dutch, default) and `meta.en.json` (English):

```json
// content/docs/meta.json (Dutch — root sidebar)
{
  "title": "Documentatie",
  "pages": [
    "index",
    "aan-de-slag",
    "---Platform---",
    "kamer-zoeken",
    "kamer-aanbieden",
    "chat",
    "---Overig---",
    "privacy-en-veiligheid",
    "veelgestelde-vragen",
    "sponsors"
  ]
}
```

```json
// content/docs/meta.en.json (English — root sidebar)
{
  "title": "Documentation",
  "pages": [
    "index",
    "aan-de-slag",
    "---Platform---",
    "kamer-zoeken",
    "kamer-aanbieden",
    "chat",
    "---Other---",
    "privacy-en-veiligheid",
    "veelgestelde-vragen",
    "sponsors"
  ]
}
```

```json
// content/docs/aan-de-slag/meta.json (Dutch)
{
  "title": "Aan de slag",
  "defaultOpen": true,
  "pages": ["index", "account-aanmaken", "je-profiel"]
}
```

```json
// content/docs/aan-de-slag/meta.en.json (English)
{
  "title": "Getting Started",
  "defaultOpen": true,
  "pages": ["index", "account-aanmaken", "je-profiel"]
}
```

```json
// content/docs/kamer-zoeken/meta.json (Dutch)
{
  "title": "Kamer zoeken",
  "pages": ["index", "zoeken-en-filteren", "reageren-op-listings"]
}
```

```json
// content/docs/kamer-zoeken/meta.en.json (English)
{
  "title": "Finding a Room",
  "pages": ["index", "zoeken-en-filteren", "reageren-op-listings"]
}
```

```json
// content/docs/privacy-en-veiligheid/meta.json (Dutch)
{
  "title": "Privacy & Veiligheid",
  "pages": ["index", "jouw-gegevens", "veiligheidstips", "datalekprocedure"]
}
```

```json
// content/docs/privacy-en-veiligheid/meta.en.json (English)
{
  "title": "Privacy & Safety",
  "pages": ["index", "jouw-gegevens", "veiligheidstips", "datalekprocedure"]
}
```

### 2.4 — MDX Frontmatter

Every `.mdx` file uses frontmatter. The default (no suffix) is Dutch:

```mdx
// aan-de-slag/account-aanmaken.mdx (Dutch)
---
title: Account aanmaken
description: Maak een account aan en verifieer jezelf via InAcademia
icon: UserPlus
---

## Stap 1: Ga naar OpenHospi

Ga naar [openhospi.nl](https://openhospi.nl) en klik op **Inloggen**.

## Stap 2: Verifieer via InAcademia

OpenHospi gebruikt InAcademia om te controleren of je student bent
aan een Nederlandse instelling. Selecteer je onderwijsinstelling en
log in met je studentaccount.
```

```mdx
// aan-de-slag/account-aanmaken.en.mdx (English)
---
title: Create an Account
description: Create an account and verify yourself through InAcademia
icon: UserPlus
---

## Step 1: Go to OpenHospi

Visit [openhospi.nl](https://openhospi.nl) and click **Log in**.

## Step 2: Verify via InAcademia

OpenHospi uses InAcademia to verify that you are a student at a
Dutch institution. Select your educational institution and log in
with your student account.
```

```mdx
// privacy-en-veiligheid/datalekprocedure.mdx (Dutch)
---
title: Datalekprocedure
description: Hoe OpenHospi omgaat met datalekken en hoe wij jou informeren
icon: ShieldAlert
---

## Wat is een datalek?

Een datalek is een beveiligingsincident waarbij persoonsgegevens per
ongeluk of onrechtmatig worden vernietigd, verloren, gewijzigd of
openbaar gemaakt.

## Hoe wij reageren

Wanneer wij een datalek ontdekken, volgen wij een vast protocol:

1. **Beoordeling** (binnen 24 uur) — Wij onderzoeken welke gegevens
   zijn getroffen, hoeveel gebruikers betrokken zijn en of het lek
   nog actief is.
2. **Indamming** — Wij nemen direct maatregelen om verdere schade te
   voorkomen, zoals het intrekken van tokens of het uitrollen van
   een noodpatch.
3. **Melding bij de AP** (binnen 72 uur) — Als het lek een risico
   vormt voor jouw rechten, melden wij dit bij de Autoriteit
   Persoonsgegevens.
4. **Melding aan jou** — Bij een hoog risico informeren wij je via
   een in-app notificatie en per e-mail.

## Jouw end-to-end versleutelde berichten

Chat-berichten op OpenHospi zijn end-to-end versleuteld. Als er een
datalek plaatsvindt in de database, zijn de berichten zelf niet
leesbaar — alleen jij en je gesprekspartner kunnen ze lezen.

## Vragen of een lek melden

Heb je een vermoeden van een datalek? Neem direct contact op via
**privacy@openhospi.nl**.
```

```mdx
// privacy-en-veiligheid/datalekprocedure.en.mdx (English)
---
title: Data Breach Response
description: How OpenHospi handles data breaches and how we inform you
icon: ShieldAlert
---

## What is a data breach?

A data breach is a security incident where personal data is
accidentally or unlawfully destroyed, lost, altered, or disclosed.

## How we respond

When we detect a data breach, we follow a fixed protocol:

1. **Assessment** (within 24 hours) — We investigate which data was
   affected, how many users are involved, and whether the breach is
   still active.
2. **Containment** — We take immediate action to prevent further
   damage, such as revoking tokens or deploying an emergency patch.
3. **Report to AP** (within 72 hours) — If the breach poses a risk
   to your rights, we report it to the Dutch Data Protection
   Authority.
4. **Notification to you** — If there is a high risk, we inform you
   via an in-app notification and by email.

## Your end-to-end encrypted messages

Chat messages on OpenHospi are end-to-end encrypted. If a database
breach occurs, the messages themselves are not readable — only you
and your conversation partner can read them.

## Questions or report a breach

Do you suspect a data breach? Contact us directly at
**privacy@openhospi.nl**.
```

### 2.5 — Internal vs Public Documentation

The data breach response page above is the **user-facing** version — it explains what users can expect. The full internal Data Breach Response Plan (with assessment matrices, notification templates, contact chains, and operational procedures) stays as an internal document in the repo at `docs/gdpr/` and is NOT published to the docs site.

| Document | Location | Audience |
|----------|----------|----------|
| Data Breach Response Plan (full) | `docs/gdpr/` in repo | Internal team |
| Datalekprocedure (public) | `apps/docs/content/docs/privacy-en-veiligheid/datalekprocedure.mdx` | End users |

---

## Phase 3: Internationalization (i18n)

### 3.1 — Define i18n Config

Dutch is the default language. English is the translation.

```ts
// apps/docs/lib/i18n.ts
import { defineI18n } from 'fumadocs-core/i18n';

export const i18n = defineI18n({
  defaultLanguage: 'nl',
  languages: ['nl', 'en'],
});
```

### 3.2 — i18n Middleware

```ts
// apps/docs/proxy.ts
import { createI18nMiddleware } from 'fumadocs-core/i18n/middleware';
import { i18n } from '@/lib/i18n';

export default createI18nMiddleware(i18n);

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|llms.txt|llms-full.txt).*)'],
};
```

### 3.3 — Translations & Layout

```ts
// apps/docs/lib/layout.shared.tsx
import { i18n } from '@/lib/i18n';
import { defineI18nUI } from 'fumadocs-ui/i18n';
import type { BaseLayoutProps } from 'fumadocs-ui/layouts/shared';

export const i18nUI = defineI18nUI(i18n, {
  translations: {
    nl: {
      displayName: 'Nederlands',
      search: 'Zoek documentatie',
    },
    en: {
      displayName: 'English',
    },
  },
});

export function baseOptions(locale: string): BaseLayoutProps {
  return {
    i18n,
    nav: {
      title: 'OpenHospi Docs',
    },
  };
}
```

### 3.4 — Root Layout with i18n

```tsx
// apps/docs/app/[lang]/layout.tsx
import { RootProvider } from 'fumadocs-ui/provider/next';
import { i18nUI } from '@/lib/layout.shared';

export default async function RootLayout({
  params,
  children,
}: {
  params: Promise<{ lang: string }>;
  children: React.ReactNode;
}) {
  const lang = (await params).lang;

  return (
    <html lang={lang}>
      <body>
        <RootProvider i18n={i18nUI.provider(lang)}>
          {children}
        </RootProvider>
      </body>
    </html>
  );
}
```

### 3.5 — Source Loader with i18n

```ts
// apps/docs/lib/source.ts
import { loader } from 'fumadocs-core/source';
import { docs } from 'collections/server';
import { i18n } from '@/lib/i18n';

export const source = loader({
  i18n,
  source: docs.toFumadocsSource(),
  baseUrl: '/docs',
});
```

### 3.6 — Docs Layout (pass locale)

```tsx
// apps/docs/app/[lang]/docs/layout.tsx
import type { ReactNode } from 'react';
import { source } from '@/lib/source';
import { DocsLayout } from 'fumadocs-ui/layouts/docs';
import { baseOptions } from '@/lib/layout.shared';

export default async function Layout({
  params,
  children,
}: {
  params: Promise<{ lang: string }>;
  children: ReactNode;
}) {
  const { lang } = await params;

  return (
    <DocsLayout {...baseOptions(lang)} tree={source.getPageTree(lang)}>
      {children}
    </DocsLayout>
  );
}
```

### 3.7 — Docs Page (pass locale)

```tsx
// apps/docs/app/[lang]/docs/[[...slug]]/page.tsx
import { source } from '@/lib/source';

export default async function Page({
  params,
}: {
  params: Promise<{ lang: string; slug?: string[] }>;
}) {
  const { slug, lang } = await params;
  const page = source.getPage(slug, lang);
  // ...render page
}

export function generateStaticParams() {
  return source.generateParams();
}
```

### 3.8 — Crowdin Integration

Add docs content paths to your existing `crowdin.yml`. English is the translation target:

```yaml
files:
  - source: /apps/docs/content/docs/**/*.mdx
    translation: /apps/docs/content/docs/**/%file_name%.%locale%.mdx
    ignore:
      - /apps/docs/content/docs/**/*.en.mdx
```

---

## Phase 4: OG Image Generation (next/og)

### 4.1 — Image Helper

```ts
// apps/docs/lib/source.ts (add to existing file)
import { type InferPageType } from 'fumadocs-core/source';

export function getPageImage(page: InferPageType<typeof source>) {
  const segments = [...page.slugs, 'image.png'];
  return {
    segments,
    url: `/og/docs/${segments.join('/')}`,
  };
}
```

### 4.2 — Route Handler

```tsx
// apps/docs/app/og/docs/[...slug]/route.tsx
import { getPageImage, source } from '@/lib/source';
import { notFound } from 'next/navigation';
import { ImageResponse } from 'next/og';
import { generate as DefaultImage } from 'fumadocs-ui/og';

export const revalidate = false;

export async function GET(
  _req: Request,
  { params }: RouteContext<'/og/docs/[...slug]'>
) {
  const { slug } = await params;
  const page = source.getPage(slug.slice(0, -1));
  if (!page) notFound();

  return new ImageResponse(
    <DefaultImage
      title={page.data.title}
      description={page.data.description}
      site="OpenHospi Docs"
    />,
    { width: 1200, height: 630 }
  );
}

export function generateStaticParams() {
  return source.getPages().map((page) => ({
    lang: page.locale,
    slug: getPageImage(page).segments,
  }));
}
```

### 4.3 — Use in Docs Page Metadata

```tsx
// in app/[lang]/docs/[[...slug]]/page.tsx
export async function generateMetadata(props) {
  const params = await props.params;
  const page = source.getPage(params.slug, params.lang);
  if (!page) notFound();

  const image = getPageImage(page);
  return {
    title: page.data.title,
    description: page.data.description,
    openGraph: {
      images: [{ url: image.url }],
    },
  };
}
```

---

## Phase 5: LLM Integration

### 5.1 — Enable Processed Markdown

```ts
// apps/docs/source.config.ts
import { defineDocs } from 'fumadocs-mdx/config';

export const docs = defineDocs({
  docs: {
    postprocess: {
      includeProcessedMarkdown: true,
    },
  },
});
```

### 5.2 — LLM Text Helper

```ts
// apps/docs/lib/get-llm-text.ts
import { source } from '@/lib/source';
import type { InferPageType } from 'fumadocs-core/source';

export async function getLLMText(page: InferPageType<typeof source>) {
  const processed = await page.data.getText('processed');
  return `# ${page.data.title} (${page.url})\n\n${processed}`;
}
```

### 5.3 — `llms.txt` Route

```ts
// apps/docs/app/llms.txt/route.ts
import { source } from '@/lib/source';
import { llms } from 'fumadocs-core/source';

export const revalidate = false;

export function GET() {
  return new Response(llms(source).index());
}
```

### 5.4 — `llms-full.txt` Route

```ts
// apps/docs/app/llms-full.txt/route.ts
import { source } from '@/lib/source';
import { getLLMText } from '@/lib/get-llm-text';

export const revalidate = false;

export async function GET() {
  const scan = source.getPages().map(getLLMText);
  const scanned = await Promise.all(scan);
  return new Response(scanned.join('\n\n'));
}
```

### 5.5 — Per-Page `.mdx` Route

```ts
// apps/docs/app/llms.mdx/docs/[[...slug]]/route.ts
import { getLLMText } from '@/lib/get-llm-text';
import { source } from '@/lib/source';
import { notFound } from 'next/navigation';

export const revalidate = false;

export async function GET(
  _req: Request,
  { params }: RouteContext<'/llms.mdx/docs/[[...slug]]'>
) {
  const { slug } = await params;
  const page = source.getPage(slug);
  if (!page) notFound();

  return new Response(await getLLMText(page), {
    headers: { 'Content-Type': 'text/markdown' },
  });
}

export function generateStaticParams() {
  return source.generateParams();
}
```

### 5.6 — Rewrite Rule

```ts
// apps/docs/next.config.ts (add to config)
async rewrites() {
  return [
    {
      source: '/docs/:path*.mdx',
      destination: '/llms.mdx/docs/:path*',
    },
  ];
},
```

### 5.7 — Page Actions (Copy for AI / View as Markdown)

```bash
cd apps/docs
pnpm dlx @fumadocs/cli add ai/page-actions
```

Then in your docs page:

```tsx
import { LLMCopyButton, ViewOptions } from '@/components/ai/page-actions';

// Inside the DocsPage component:
const markdownUrl = `${page.url}.mdx`;

<div className="flex flex-row gap-2 items-center border-b pt-2 pb-6">
  <LLMCopyButton markdownUrl={markdownUrl} />
  <ViewOptions
    markdownUrl={markdownUrl}
    githubUrl={`https://github.com/OpenHospi/OpenHospi/blob/main/apps/docs/content/docs/${page.path}`}
  />
</div>
```

---

## Phase 6: Mermaid Diagrams

### 6.1 — Install Dependencies

```bash
cd apps/docs
pnpm add mermaid next-themes
```

### 6.2 — Create Mermaid Component

```tsx
// apps/docs/components/mdx/mermaid.tsx
'use client';

import { use, useEffect, useId, useState } from 'react';
import { useTheme } from 'next-themes';

export function Mermaid({ chart }: { chart: string }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  if (!mounted) return null;
  return <MermaidContent chart={chart} />;
}

const cache = new Map<string, Promise<unknown>>();

function cachePromise<T>(key: string, setPromise: () => Promise<T>): Promise<T> {
  const cached = cache.get(key);
  if (cached) return cached as Promise<T>;
  const promise = setPromise();
  cache.set(key, promise);
  return promise;
}

function MermaidContent({ chart }: { chart: string }) {
  const id = useId();
  const { resolvedTheme } = useTheme();
  const { default: mermaid } = use(
    cachePromise('mermaid', () => import('mermaid'))
  );

  mermaid.initialize({
    startOnLoad: false,
    securityLevel: 'loose',
    fontFamily: 'inherit',
    themeCSS: 'margin: 1.5rem auto 0;',
    theme: resolvedTheme === 'dark' ? 'dark' : 'default',
  });

  const { svg, bindFunctions } = use(
    cachePromise(`${chart}-${resolvedTheme}`, () =>
      mermaid.render(id, chart.replaceAll('\\n', '\n'))
    )
  );

  return (
    <div
      ref={(container) => { if (container) bindFunctions?.(container); }}
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}
```

### 6.3 — Register as MDX Component

```tsx
// apps/docs/mdx-components.tsx
import defaultMdxComponents from 'fumadocs-ui/mdx';
import { Mermaid } from '@/components/mdx/mermaid';
import type { MDXComponents } from 'mdx/types';

export function getMDXComponents(components?: MDXComponents): MDXComponents {
  return {
    ...defaultMdxComponents,
    Mermaid,
    ...components,
  };
}
```

### 6.4 — Enable Codeblock Syntax

Add the remark plugin so you can use ` ```mermaid ` codeblocks:

```ts
// apps/docs/source.config.ts (add to existing config)
import { remarkMdxMermaid } from 'fumadocs-core/mdx-plugins';

export default defineConfig({
  mdxOptions: {
    remarkPlugins: [remarkMdxMermaid],
  },
});
```

Now you can write in any `.mdx` file:

````mdx
```mermaid
graph TD;
  A[Account aanmaken] -->|InAcademia| B[Verificatie];
  B --> C[Je profiel instellen];
  C --> D[Kamer zoeken];
  C --> E[Kamer aanbieden];
  D --> F[Berichten & chat];
  E --> F;
```
````

---

## Phase 7: Feedback → GitHub Discussions

### 7.1 — Install Feedback Components

```bash
cd apps/docs
pnpm dlx @fumadocs/cli add feedback
```

### 7.2 — Create a GitHub App

1. Go to **github.com/organizations/OpenHospi/settings/apps** → New GitHub App
2. Name: `OpenHospi Docs Feedback`
3. Permissions needed: **Discussions: Read & Write**
4. Install it on the `OpenHospi/OpenHospi` repo
5. Note down the **App ID** and generate a **Private Key**

### 7.3 — Environment Variables

```env
# apps/docs/.env.local
GITHUB_APP_ID=123456
GITHUB_APP_PRIVATE_KEY="-----BEGIN RSA PRIVATE KEY-----\n..."
```

### 7.4 — Create "Docs Feedback" Discussion Category

In the OpenHospi/OpenHospi repo, go to **Discussions → Categories → New Category**:
- Name: `Docs Feedback`
- Format: Open-ended

### 7.5 — GitHub Integration Server Action

```ts
// apps/docs/lib/github.ts
import { App, Octokit } from 'octokit';
import {
  blockFeedback,
  type BlockFeedback,
  pageFeedback,
  type ActionResponse,
  type PageFeedback,
} from '@/components/feedback/schema';

export const repo = 'OpenHospi';
export const owner = 'OpenHospi';
export const DocsCategory = 'Docs Feedback';

let instance: Octokit | undefined;

async function getOctokit(): Promise<Octokit> {
  if (instance) return instance;
  const appId = process.env.GITHUB_APP_ID;
  const privateKey = process.env.GITHUB_APP_PRIVATE_KEY;

  if (!appId || !privateKey) {
    throw new Error('Missing GitHub App credentials for docs feedback.');
  }

  const app = new App({ appId, privateKey });
  const { data } = await app.octokit.request(
    'GET /repos/{owner}/{repo}/installation',
    { owner, repo, headers: { 'X-GitHub-Api-Version': '2022-11-28' } }
  );

  instance = await app.getInstallationOctokit(data.id);
  return instance;
}

interface RepositoryInfo {
  id: string;
  discussionCategories: {
    nodes: { id: string; name: string }[];
  };
}

let cachedDestination: RepositoryInfo | undefined;

async function getFeedbackDestination() {
  if (cachedDestination) return cachedDestination;
  const octokit = await getOctokit();

  const { repository }: { repository: RepositoryInfo } =
    await octokit.graphql(`
      query {
        repository(owner: "${owner}", name: "${repo}") {
          id
          discussionCategories(first: 25) {
            nodes { id name }
          }
        }
      }
    `);

  return (cachedDestination = repository);
}

export async function onPageFeedbackAction(
  feedback: PageFeedback
): Promise<ActionResponse> {
  'use server';
  feedback = pageFeedback.parse(feedback);
  return createDiscussionThread(
    feedback.url,
    `[${feedback.opinion}] ${feedback.message}\n\n> Doorgestuurd vanuit docs feedback.`
  );
}

export async function onBlockFeedbackAction(
  feedback: BlockFeedback
): Promise<ActionResponse> {
  'use server';
  feedback = blockFeedback.parse(feedback);
  return createDiscussionThread(
    feedback.url,
    `> ${feedback.blockBody ?? feedback.blockId}\n\n${feedback.message}\n\n> Doorgestuurd vanuit docs feedback.`
  );
}

async function createDiscussionThread(pageId: string, body: string) {
  const octokit = await getOctokit();
  const destination = await getFeedbackDestination();
  const category = destination.discussionCategories.nodes.find(
    (c) => c.name === DocsCategory
  );

  if (!category) {
    throw new Error(
      `Maak eerst een "${DocsCategory}" categorie aan in GitHub Discussions.`
    );
  }

  const title = `Feedback for ${pageId}`;
  const {
    search: { nodes: [discussion] },
  }: { search: { nodes: { id: string; url: string }[] } } =
    await octokit.graphql(`
      query {
        search(
          type: DISCUSSION,
          query: ${JSON.stringify(
            `${title} in:title repo:${owner}/${repo} author:@me`
          )},
          first: 1
        ) {
          nodes { ... on Discussion { id, url } }
        }
      }
    `);

  if (discussion) {
    const result: {
      addDiscussionComment: { comment: { id: string; url: string } };
    } = await octokit.graphql(`
      mutation {
        addDiscussionComment(input: {
          body: ${JSON.stringify(body)},
          discussionId: "${discussion.id}"
        }) {
          comment { id, url }
        }
      }
    `);
    return { githubUrl: result.addDiscussionComment.comment.url };
  } else {
    const result: {
      createDiscussion: { discussion: { id: string; url: string } };
    } = await octokit.graphql(`
      mutation {
        createDiscussion(input: {
          repositoryId: "${destination.id}",
          categoryId: "${category.id}",
          body: ${JSON.stringify(body)},
          title: ${JSON.stringify(title)}
        }) {
          discussion { id, url }
        }
      }
    `);
    return { githubUrl: result.createDiscussion.discussion.url };
  }
}
```

### 7.6 — Wire Feedback into Docs Page

```tsx
// apps/docs/app/[lang]/docs/[[...slug]]/page.tsx
import { Feedback } from '@/components/feedback/client';
import { onPageFeedbackAction } from '@/lib/github';

// Inside the DocsPage component, at the bottom:
<Feedback onSendAction={onPageFeedbackAction} />
```

### 7.7 — Block-Level Feedback (Optional)

Add the remark plugin to `source.config.ts`:

```ts
import {
  remarkFeedbackBlock,
} from 'fumadocs-core/mdx-plugins/remark-feedback-block';

export default defineConfig({
  mdxOptions: {
    remarkPlugins: [remarkMdxMermaid, remarkFeedbackBlock],
  },
});
```

Then register the `FeedbackBlock` in `mdx-components.tsx`:

```tsx
import { FeedbackBlock } from '@/components/feedback/client';
import { onBlockFeedbackAction } from '@/lib/github';

export function getMDXComponents(components?: MDXComponents): MDXComponents {
  return {
    ...defaultMdxComponents,
    Mermaid,
    FeedbackBlock: ({ children, ...rest }) => (
      <FeedbackBlock {...rest} onSendAction={onBlockFeedbackAction}>
        {children}
      </FeedbackBlock>
    ),
    ...components,
  };
}
```

---

## Phase 8: Link Validation

### 8.1 — Install

```bash
cd apps/docs
pnpm add -D next-validate-link
```

### 8.2 — Create Lint Script

```ts
// apps/docs/scripts/lint.ts
import {
  type FileObject,
  printErrors,
  scanURLs,
  validateFiles,
} from 'next-validate-link';
import type { InferPageType } from 'fumadocs-core/source';
import { source } from '@/lib/source';

async function checkLinks() {
  const scanned = await scanURLs({
    preset: 'next',
    populate: {
      'docs/[[...slug]]': source.getPages().map((page) => ({
        value: { slug: page.slugs },
        hashes: getHeadings(page),
      })),
    },
  });

  printErrors(
    await validateFiles(await getFiles(), {
      scanned,
      markdown: {
        components: {
          Card: { attributes: ['href'] },
        },
      },
      checkRelativePaths: 'as-url',
    }),
    true
  );
}

function getHeadings({ data }: InferPageType<typeof source>): string[] {
  return data.toc.map((item) => item.url.slice(1));
}

function getFiles() {
  const promises = source.getPages().map(
    async (page): Promise<FileObject> => ({
      path: page.absolutePath,
      content: await page.data.getText('raw'),
      url: page.url,
      data: page.data,
    })
  );
  return Promise.all(promises);
}

void checkLinks();
```

### 8.3 — Add Script to `package.json`

```json
{
  "scripts": {
    "lint:links": "bun ./scripts/lint.ts"
  }
}
```

### 8.4 — CI Integration

Add to `.github/workflows/` or your existing CI:

```yaml
- name: Validate docs links
  run: pnpm --filter @openhospi/docs lint:links
```

---

## Phase 9: Vercel Deployment & Domain

### 9.1 — Create a New Vercel Project

Each app in a monorepo needs its own Vercel project (a single project can only have one root directory and one build output).

| Vercel Project | Root Directory | Domain |
|---|---|---|
| `openhospi` (existing) | `apps/web` | `openhospi.nl` |
| `openhospi-docs` (new) | `apps/docs` | `docs.openhospi.nl` |

Steps:

1. Go to **vercel.com/new**
2. Import the **OpenHospi/OpenHospi** repo (same repo, second project)
3. Set **Root Directory** to `apps/docs`
4. Framework Preset: **Next.js** (auto-detected)
5. Add environment variables:
   - `GITHUB_APP_ID`
   - `GITHUB_APP_PRIVATE_KEY`

### 9.2 — Configure Domain

In the new Vercel project's **Settings → Domains**:

1. Add `docs.openhospi.nl`
2. Since your NS is on Vercel, DNS is handled automatically — no manual CNAME needed
3. Vercel will auto-provision the SSL certificate

### 9.3 — Ignored Build Step

Under **Settings → Git → Ignored Build Step**, use:

```bash
git diff --quiet HEAD^ HEAD -- apps/docs/ packages/
```

This ensures the docs project only rebuilds when docs content or shared packages change, not when `apps/web` or `apps/mobile` change.

---

## Phase 10: Final Checklist

| Task | Status |
|------|--------|
| Scaffold `apps/docs` with `create fumadocs-app` | ☐ |
| Configure i18n with `nl` as default, `en` as translation | ☐ |
| Set up i18n middleware (`proxy.ts`) | ☐ |
| Set up source loader with i18n | ☐ |
| Create `[lang]` route structure | ☐ |
| Create content folders + `meta.json` / `meta.en.json` for all sections | ☐ |
| Write Dutch content: Aan de slag (account aanmaken, je profiel) | ☐ |
| Write Dutch content: Kamer zoeken (zoeken, filteren, reageren) | ☐ |
| Write Dutch content: Kamer aanbieden (listing aanmaken, beheren) | ☐ |
| Write Dutch content: Chat & communicatie (berichten) | ☐ |
| Write Dutch content: Privacy & Veiligheid (jouw gegevens, veiligheidstips, datalekprocedure) | ☐ |
| Write Dutch content: Veelgestelde vragen | ☐ |
| Write Dutch content: Sponsors & Partners | ☐ |
| OG image route handler | ☐ |
| LLM routes (`llms.txt`, `llms-full.txt`, `*.mdx`) | ☐ |
| AI page actions (copy for AI button) | ☐ |
| Mermaid component + remark plugin | ☐ |
| Feedback component with GitHub Discussions integration | ☐ |
| Create GitHub App for feedback | ☐ |
| Create "Docs Feedback" discussion category | ☐ |
| Install `octokit` dependency | ☐ |
| Link validation script | ☐ |
| New Vercel project created with `apps/docs` root | ☐ |
| `docs.openhospi.nl` domain configured | ☐ |
| Environment variables set in Vercel | ☐ |
| Add docs paths to `crowdin.yml` for English translations | ☐ |
| CI check for link validation | ☐ |

---

## Dependencies Summary

```bash
# In apps/docs
pnpm add fumadocs-core fumadocs-ui fumadocs-mdx next react react-dom
pnpm add mermaid next-themes octokit
pnpm add -D next-validate-link @fumadocs/cli tailwindcss
```

## Key URLs When Done

| URL | Purpose |
|-----|---------|
| `docs.openhospi.nl/docs` | Dutch docs homepage |
| `docs.openhospi.nl/docs/aan-de-slag/account-aanmaken` | Account aanmaken (Dutch) |
| `docs.openhospi.nl/docs/veelgestelde-vragen` | Veelgestelde vragen (Dutch) |
| `docs.openhospi.nl/en/docs` | English docs homepage |
| `docs.openhospi.nl/en/docs/aan-de-slag/account-aanmaken` | Create account (English) |
| `docs.openhospi.nl/llms.txt` | LLM index |
| `docs.openhospi.nl/llms-full.txt` | Full docs for AI |
| `docs.openhospi.nl/docs/page-name.mdx` | Per-page markdown for AI |
