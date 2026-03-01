import type { ReactNode } from "react";

import { ExternalLink } from "lucide-react";

// Combined regex with named groups for classification
// Priority: email > GDPR article > Dutch phone > URL with protocol > bare domain
const LINK_PATTERN =
  // eslint-disable-next-line no-useless-escape
  /([\w.+-]+@[\w-]+\.[\w.-]+)|(?:Art\.?\s*(\d+)(?:\(\d+\)(?:\([a-z]\))?)?(?:\s+(?:GDPR|AVG|DSGVO|UAVG|Telecommunicatiewet)))|(\b0\d{2}\s\d{3}\s\d{2}\s\d{2}\b)|(https?:\/\/[^\s),]+)|((?:[\w-]+\.)+(?:nl|eu|com|org|de|io)(?:\/[^\s),]*)?)/g;

const GDPR_LAWS: Record<string, string> = {
  GDPR: "https://gdpr.eu/article-",
  AVG: "https://gdpr.eu/article-",
  DSGVO: "https://gdpr.eu/article-",
  UAVG: "https://wetten.overheid.nl/BWBR0040940/",
  Telecommunicatiewet: "https://wetten.overheid.nl/BWBR0009950/",
};

// More specific regex for GDPR article extraction (used in the render step)
const GDPR_ARTICLE_RE =
  /Art\.?\s*(\d+)(?:\(\d+\)(?:\([a-z]\))?)?\s+(GDPR|AVG|DSGVO|UAVG|Telecommunicatiewet)/;

function classifyAndRender(match: string, key: number): ReactNode {
  const linkClass =
    "text-primary underline underline-offset-2 hover:text-primary/80 inline-flex items-center gap-0.5";

  // Email
  if (match.includes("@") && !match.startsWith("http")) {
    return (
      <a key={key} href={`mailto:${match}`} className={linkClass}>
        {match}
      </a>
    );
  }

  // GDPR / legal article reference
  const articleMatch = GDPR_ARTICLE_RE.exec(match);
  if (articleMatch) {
    const [, articleNum, law] = articleMatch;
    const base = GDPR_LAWS[law];
    const href =
      law === "UAVG" || law === "Telecommunicatiewet"
        ? base
        : `${base}${articleNum}/`;
    return (
      <a
        key={key}
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={linkClass}
      >
        {match}
        <ExternalLink className="inline size-3" />
      </a>
    );
  }

  // Dutch phone number (e.g. 070 888 85 00)
  if (/^0\d{2}\s/.test(match)) {
    const digits = match.replace(/\s/g, "");
    return (
      <a key={key} href={`tel:+31${digits.slice(1)}`} className={linkClass}>
        {match}
      </a>
    );
  }

  // URL with protocol
  if (match.startsWith("http")) {
    // Strip trailing punctuation that's not part of the URL
    const cleaned = match.replace(/[.)]+$/, "");
    return (
      <a
        key={key}
        href={cleaned}
        target="_blank"
        rel="noopener noreferrer"
        className={linkClass}
      >
        {cleaned}
        <ExternalLink className="inline size-3" />
      </a>
    );
  }

  // Bare domain
  const cleaned = match.replace(/[.)]+$/, "");
  return (
    <a
      key={key}
      href={`https://${cleaned}`}
      target="_blank"
      rel="noopener noreferrer"
      className={linkClass}
    >
      {cleaned}
      <ExternalLink className="inline size-3" />
    </a>
  );
}

export function AutoLinkedText({ text }: { text: string }) {
  const nodes: ReactNode[] = [];
  let lastIndex = 0;
  let matchCount = 0;

  // Reset regex state
  LINK_PATTERN.lastIndex = 0;

  let match: RegExpExecArray | null;
  while ((match = LINK_PATTERN.exec(text)) !== null) {
    // Push preceding plain text
    if (match.index > lastIndex) {
      nodes.push(text.slice(lastIndex, match.index));
    }
    nodes.push(classifyAndRender(match[0], matchCount++));
    lastIndex = match.index + match[0].length;
  }

  // Push remaining text
  if (lastIndex < text.length) {
    nodes.push(text.slice(lastIndex));
  }

  // No links found — return plain string for performance
  if (matchCount === 0) {
    return <>{text}</>;
  }

  return <>{nodes}</>;
}
