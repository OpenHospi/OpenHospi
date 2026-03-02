import { ExternalLink } from "lucide-react";
import type { ReactNode } from "react";

// Combined regex for auto-linking legal text.
// Priority: email > law article > Dutch phone > URL with protocol > bare domain
//
// Law article sub-patterns:
//   1) [Aa]rt. N ... LAWNAME  — handles EN (1)(c), NL , lid N, onder X, and DE Abs. N lit. X
//   2) Telecommunicatiewet [Aa]rt. N.Na — reversed format (law name first)
//
const LINK_PATTERN =
  /([\w.+-]+@[\w-]+\.[\w.-]+)|(?:\b[Aa]rt\.?\s*\d+(?:\.\d+\w?)?(?:\(\d+\)(?:\([a-z]\))?|(?:[,\s]+(?:lid|onder|Abs\.|lit\.|Nr\.)\s*\w+){1,4},?|\s+(?:to|tot\s+en\s+met|bis)\s+\d+)?\s+(?:GDPR|AVG|DSGVO|UAVG|Telecommunicatiewet)\b|\bTelecommunicatiewet\s+[Aa]rt\.?\s*[\d.]+\w?)|(\b0\d{2}\s\d{3}\s\d{2}\s\d{2}\b)|(https?:\/\/\S+?)(?=[),\s]|$)|((?:[\w-]+\.)+(?:nl|eu|com|org|de|io)(?:\/\S*?)?)(?=[),\s]|$)/g;

const GDPR_LAWS: Record<string, string> = {
  GDPR: "https://gdpr.eu/article-",
  AVG: "https://gdpr.eu/article-",
  DSGVO: "https://gdpr.eu/article-",
  UAVG: "https://wetten.overheid.nl/BWBR0040940/",
  Telecommunicatiewet: "https://wetten.overheid.nl/BWBR0009950/",
};

// Extracts article number (group 1) and law name (group 2) from a matched string.
// Uses [\s\S]*? to bridge all three notation styles (EN parens, NL comma, DE keyword).
 
const GDPR_ARTICLE_RE =
  /[Aa]rt\.?\s*(\d+(?:\.\d+\w?)?)[\s\S]*?(GDPR|AVG|DSGVO|UAVG|Telecommunicatiewet)/;

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

  // Telecommunicatiewet Art. reference (reversed format: law name first)
  if (match.startsWith("Telecommunicatiewet")) {
    return (
      <a
        key={key}
        href={GDPR_LAWS.Telecommunicatiewet}
        target="_blank"
        rel="noopener noreferrer"
        className={linkClass}
      >
        {match}
        <ExternalLink className="inline size-3" />
      </a>
    );
  }

  // GDPR / AVG / DSGVO / UAVG article reference
  const articleMatch = GDPR_ARTICLE_RE.exec(match);
  if (articleMatch) {
    const [, articleNum, law] = articleMatch;
    const base = GDPR_LAWS[law];
    const href = law === "UAVG" || law === "Telecommunicatiewet" ? base : `${base}${articleNum}/`;
    return (
      <a key={key} href={href} target="_blank" rel="noopener noreferrer" className={linkClass}>
        {match}
        <ExternalLink className="inline size-3" />
      </a>
    );
  }

  // Dutch phone number (e.g. 070 888 85 00)
  if (/^0\d{2}\s/.test(match)) {
    const digits = match.replaceAll(/\s/g, "");
    return (
      <a key={key} href={`tel:+31${digits.slice(1)}`} className={linkClass}>
        {match}
      </a>
    );
  }

  // URL with protocol
  if (match.startsWith("http")) {
    const cleaned = match.replace(/[.)]+$/, "");
    return (
      <a key={key} href={cleaned} target="_blank" rel="noopener noreferrer" className={linkClass}>
        {cleaned}
        <ExternalLink className="inline size-3" />
      </a>
    );
  }

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
  // eslint-disable-next-line react-hooks/immutability
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
