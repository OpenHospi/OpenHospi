import { ExternalLink } from "lucide-react";
import type { ReactNode } from "react";

// Split into individual patterns for auto-linking legal text.
// Priority is enforced by order in the array below.
// All quantifiers are bounded (RFC/DNS limits) and [a-zA-Z]? replaces \w? to avoid digit overlap.

// 1. Email addresses (user@domain.tld) — local ≤64, labels ≤63, ≤10 domain levels
// eslint-disable-next-line security/detect-unsafe-regex -- bounded nested quantifiers; literal . separators prevent backtracking
const EMAIL_RE = /[\w.+-]{1,64}@[a-zA-Z0-9-]{1,63}(?:\.[a-zA-Z0-9-]{1,63}){1,10}/g;

// 2. Law article references — split into sub-patterns to stay under complexity limit.
//    EN parenthetical style: Art. 6(1)(c) GDPR
const LAW_ARTICLE_PAREN_RE =
  // eslint-disable-next-line security/detect-unsafe-regex -- bounded quantifiers, no overlapping classes
  /\b[Aa]rt\.?\s{0,5}\d{1,10}(?:\.\d{1,10}[a-zA-Z]?)?\(\d{1,5}\)(?:\([a-z]\))?\s{1,5}(?:GDPR|AVG|DSGVO|UAVG)\b/g;

//    NL keyword style: Art. 13, lid 1, onder a AVG
const LAW_ARTICLE_KEYWORD_RE =
  // eslint-disable-next-line security/detect-unsafe-regex, sonarjs/regex-complexity -- legal citation format requires keyword alternations
  /\b[Aa]rt\.?\s{0,5}\d{1,10}(?:\.\d{1,10}[a-zA-Z]?)?(?:[,\s]{1,5}(?:lid|onder|Abs\.|lit\.|Nr\.)\s{0,3}[a-zA-Z0-9]{1,10}){1,4},?\s{1,5}(?:GDPR|AVG|DSGVO|UAVG|Telecommunicatiewet)\b/g;

//    Range style: Art. 12 to 14 GDPR / Art. 12 tot en met 14 AVG / Art. 12 bis 14 DSGVO
const LAW_ARTICLE_RANGE_RE =
  // eslint-disable-next-line security/detect-unsafe-regex, sonarjs/regex-complexity -- legal citation range format requires law name alternations
  /\b[Aa]rt\.?\s{0,5}\d{1,10}(?:\.\d{1,10}[a-zA-Z]?)?\s{1,5}(?:to|tot\s{1,3}en\s{1,3}met|bis)\s{1,5}\d{1,10}\s{1,5}(?:GDPR|AVG|DSGVO|UAVG|Telecommunicatiewet)\b/g;

//    Simple style: Art. 6 GDPR (no parenthetical, no keyword, no range)
const LAW_ARTICLE_SIMPLE_RE =
  // eslint-disable-next-line security/detect-unsafe-regex -- bounded quantifiers, no overlapping classes
  /\b[Aa]rt\.?\s{0,5}\d{1,10}(?:\.\d{1,10}[a-zA-Z]?)?\s{1,5}(?:GDPR|AVG|DSGVO|UAVG|Telecommunicatiewet)\b/g;

// 2b. Telecommunicatiewet Art. N.Na — reversed format (law name first)
const TELECOM_ARTICLE_RE = /\bTelecommunicatiewet\s{1,5}[Aa]rt\.?\s{0,5}[\d.]{1,20}[a-zA-Z]?/g;

// 3. Dutch phone numbers (e.g. 070 888 85 00)
const PHONE_RE = /\b0\d{2}\s\d{3}\s\d{2}\s\d{2}\b/g;

// 4. URLs with protocol — use negated class instead of lazy \S+? to avoid backtracking
const URL_RE = /https?:\/\/[^\s),]+/g;

// 5. Bare domain names — use negated class instead of lazy \S*? to avoid backtracking
// eslint-disable-next-line security/detect-unsafe-regex -- bounded nested quantifiers; literal . separators prevent backtracking
const DOMAIN_RE = /(?:[a-zA-Z0-9-]{1,63}\.){1,10}(?:nl|eu|com|org|de|io)(?:\/[^\s),]*)?/g;

// All patterns in priority order (more specific patterns first)
const PATTERNS = [
  EMAIL_RE,
  LAW_ARTICLE_PAREN_RE,
  LAW_ARTICLE_KEYWORD_RE,
  LAW_ARTICLE_RANGE_RE,
  LAW_ARTICLE_SIMPLE_RE,
  TELECOM_ARTICLE_RE,
  PHONE_RE,
  URL_RE,
  DOMAIN_RE,
];

const GDPR_LAWS: Record<string, string> = {
  GDPR: "https://gdpr.eu/article-",
  AVG: "https://gdpr.eu/article-",
  DSGVO: "https://gdpr.eu/article-",
  UAVG: "https://wetten.overheid.nl/BWBR0040940/",
  Telecommunicatiewet: "https://wetten.overheid.nl/BWBR0009950/",
};

// Extracts article number and law name from a matched article string.
// The law name always appears at the end after whitespace.
function extractArticle(match: string): { articleNum: string; law: string } | null {
  const lawNames = ["GDPR", "AVG", "DSGVO", "UAVG", "Telecommunicatiewet"];
  for (const law of lawNames) {
    if (match.endsWith(law)) {
      // eslint-disable-next-line security/detect-unsafe-regex -- bounded, non-overlapping classes (\d vs [a-zA-Z])
      const numMatch = /\d{1,10}(?:\.\d{1,10}[a-zA-Z]?)?/.exec(match);
      if (numMatch) {
        return { articleNum: numMatch[0], law };
      }
    }
  }
  return null;
}

/** Strip trailing punctuation that got captured by greedy URL/domain patterns. */
function stripTrailing(s: string): string {
  let end = s.length;
  while (end > 0 && (s[end - 1] === "." || s[end - 1] === ")")) {
    end--;
  }
  return end === s.length ? s : s.slice(0, end);
}

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
  const articleInfo = extractArticle(match);
  if (articleInfo) {
    const { articleNum, law } = articleInfo;
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
    const cleaned = stripTrailing(match);
    return (
      <a key={key} href={cleaned} target="_blank" rel="noopener noreferrer" className={linkClass}>
        {cleaned}
        <ExternalLink className="inline size-3" />
      </a>
    );
  }

  // Bare domain
  const cleaned = stripTrailing(match);
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

interface EarliestMatch {
  index: number;
  text: string;
}

/** Find the earliest match across all patterns starting from the given position. */
function findEarliestMatch(text: string, fromIndex: number): EarliestMatch | null {
  let best: EarliestMatch | null = null;

  for (const re of PATTERNS) {
    re.lastIndex = fromIndex;
    const m = re.exec(text);
    if (
      m &&
      (best === null ||
        m.index < best.index ||
        (m.index === best.index && m[0].length > best.text.length))
    ) {
      best = { index: m.index, text: m[0] };
    }
  }

  return best;
}

export function AutoLinkedText({ text }: { text: string }) {
  const nodes: ReactNode[] = [];
  let lastIndex = 0;
  let matchCount = 0;

  let match = findEarliestMatch(text, 0);
  while (match) {
    // Push preceding plain text
    if (match.index > lastIndex) {
      nodes.push(text.slice(lastIndex, match.index));
    }
    nodes.push(classifyAndRender(match.text, matchCount++));
    lastIndex = match.index + match.text.length;
    match = findEarliestMatch(text, lastIndex);
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
