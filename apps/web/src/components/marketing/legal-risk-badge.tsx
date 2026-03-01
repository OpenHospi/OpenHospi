import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableRow,
} from "@/components/ui/table";

import { AutoLinkedText } from "./legal-auto-link";

const RISK_LABELS =
  /^(Likelihood|Impact|Residual risk|Waarschijnlijkheid|Restrisico|Wahrscheinlichkeit|Auswirkung|Restrisiko)\b/i;

const RISK_COLORS: Record<string, string> = {
  "very low":
    "bg-green-500/15 text-green-800 border-green-500/25 dark:text-green-400",
  low: "bg-green-500/15 text-green-800 border-green-500/25 dark:text-green-400",
  medium:
    "bg-yellow-500/15 text-yellow-800 border-yellow-500/25 dark:text-yellow-400",
  high: "bg-red-500/15 text-red-800 border-red-500/25 dark:text-red-400",
  "very high":
    "bg-red-500/15 text-red-800 border-red-500/25 dark:text-red-400",
};

// Maps NL/DE risk level words to the normalized English key used in RISK_COLORS
const LEVEL_ALIASES: Record<string, string> = {
  // EN
  "very low": "very low",
  low: "low",
  medium: "medium",
  high: "high",
  "very high": "very high",
  // NL
  "zeer laag": "very low",
  laag: "low",
  gemiddeld: "medium",
  hoog: "high",
  "zeer hoog": "very high",
  // DE
  "sehr gering": "very low",
  gering: "low",
  mittel: "medium",
  hoch: "high",
  "sehr hoch": "very high",
};

const RISK_LEVEL_RE =
  /^(Very\s+(?:low|high)|Low|Medium|High|Zeer\s+(?:laag|hoog)|Laag|Gemiddeld|Hoog|Sehr\s+(?:gering|hoch)|Gering|Mittel|Hoch)\b(.*)$/i;

function parseRiskLevel(value: string): {
  level: string;
  note: string;
} | null {
  const match = RISK_LEVEL_RE.exec(value.trim());
  if (!match) return null;
  const raw = match[1].toLowerCase();
  const level = LEVEL_ALIASES[raw] ?? raw;
  const note = match[2]
    .replace(/^\s*\(/, "")
    .replace(/\)\s*$/, "")
    .trim();
  return { level, note };
}

export function RiskLevelBadge({ value }: { value: string }) {
  const parsed = parseRiskLevel(value);
  if (!parsed) return <AutoLinkedText text={value} />;

  const colorClass = RISK_COLORS[parsed.level] ?? "";
  // Show the original matched text (capitalized) rather than the normalized key
  const match = RISK_LEVEL_RE.exec(value.trim());
  const displayLabel = match ? match[1] : parsed.level;
  return (
    <span className="inline-flex items-center gap-2">
      <Badge variant="outline" className={colorClass}>
        {displayLabel.charAt(0).toUpperCase() + displayLabel.slice(1).toLowerCase()}
      </Badge>
      {parsed.note && (
        <span className="text-xs text-muted-foreground">{parsed.note}</span>
      )}
    </span>
  );
}

export function isRiskSection(items: string[]): boolean {
  return items.some((item) => RISK_LABELS.test(item.split(" — ")[0]));
}

export function LegalRiskAssessment({ items }: { items: string[] }) {
  return (
    <div className="mt-4 border-l-4 border-l-primary/50 pl-0">
      <Table>
        <TableBody>
          {items.map((item, i) => {
            const dashIdx = item.indexOf(" — ");
            if (dashIdx <= 0) {
              return (
                <TableRow key={i}>
                  <TableCell colSpan={2} className="text-muted-foreground whitespace-normal">
                    <AutoLinkedText text={item} />
                  </TableCell>
                </TableRow>
              );
            }

            const label = item.slice(0, dashIdx);
            const value = item.slice(dashIdx + 3);
            const isRiskLabel = RISK_LABELS.test(label);

            return (
              <TableRow key={i}>
                <TableCell className="w-40 align-top font-medium text-foreground sm:w-48">
                  {label}
                </TableCell>
                <TableCell className="text-muted-foreground whitespace-normal">
                  {isRiskLabel ? (
                    <RiskLevelBadge value={value} />
                  ) : (
                    <AutoLinkedText text={value} />
                  )}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
