import type { Locale } from "@openhospi/i18n";
import { APP_NAME, SUPPORTED_LOCALES } from "@openhospi/shared/constants";

const BASE_URL = process.env.NEXT_PUBLIC_MARKETING_URL ?? "https://openhospi.nl";

/**
 * Returns `alternates` object for Next.js `generateMetadata`.
 * Next.js auto-generates `<link rel="canonical">` and `<link rel="alternate" hreflang="...">`.
 */
export function alternatesForPath(locale: Locale, path: string) {
  return {
    canonical: `${BASE_URL}/${locale}${path}`,
    languages: Object.fromEntries(SUPPORTED_LOCALES.map((l) => [l, `${BASE_URL}/${l}${path}`])),
  };
}

/** Sanitize JSON-LD string to prevent XSS (per Next.js docs). */
function sanitizeJsonLd(json: string): string {
  return json.replaceAll("<", "\\u003c");
}

export function breadcrumbJsonLd(locale: Locale, items: { name: string; path: string }[]): string {
  return sanitizeJsonLd(
    JSON.stringify({
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: items.map((item, i) => ({
        "@type": "ListItem",
        position: i + 1,
        name: item.name,
        item: `${BASE_URL}/${locale}${item.path}`,
      })),
    }),
  );
}

export function faqJsonLd(items: { question: string; answer: string }[]): string {
  return sanitizeJsonLd(
    JSON.stringify({
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: items.map((item) => ({
        "@type": "Question",
        name: item.question,
        acceptedAnswer: {
          "@type": "Answer",
          text: item.answer,
        },
      })),
    }),
  );
}

export function organizationJsonLd(): string {
  return sanitizeJsonLd(
    JSON.stringify({
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "Organization",
          "@id": `${BASE_URL}/#organization`,
          name: APP_NAME,
          url: BASE_URL,
          logo: `${BASE_URL}/icon.svg`,
          sameAs: [
            "https://github.com/rubentalstra/OpenHospi",
            "https://www.instagram.com/openhospi",
            "https://nl.trustpilot.com/review/openhospi.nl",
          ],
        },
        {
          "@type": "WebSite",
          "@id": `${BASE_URL}/#website`,
          url: BASE_URL,
          name: APP_NAME,
          publisher: { "@id": `${BASE_URL}/#organization` },
          potentialAction: {
            "@type": "SearchAction",
            target: {
              "@type": "EntryPoint",
              urlTemplate: `${BASE_URL}/nl/rooms?q={search_term_string}`,
            },
            "query-input": "required name=search_term_string",
          },
        },
      ],
    }),
  );
}
