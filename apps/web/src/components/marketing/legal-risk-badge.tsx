import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";

import { AutoLinkedText } from "./legal-auto-link";

const RISK_LABELS =
  /^(Likelihood|Impact|Residual risk|Waarschijnlijkheid|Restrisico|Wahrscheinlichkeit|Auswirkung|Restrisiko)\b/i;

const RISK_COLORS: Record<string, string> = {
  "very low": "bg-green-500/15 text-green-800 border-green-500/25 dark:text-green-400",
  low: "bg-green-500/15 text-green-800 border-green-500/25 dark:text-green-400",
  medium: "bg-yellow-500/15 text-yellow-800 border-yellow-500/25 dark:text-yellow-400",
  high: "bg-red-500/15 text-red-800 border-red-500/25 dark:text-red-400",
  "very high": "bg-red-500/15 text-red-800 border-red-500/25 dark:text-red-400",
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

// Sort aliases longest-first to match "very low" before "low"
const SORTED_ALIASES = Object.keys(LEVEL_ALIASES).sort((a, b) => b.length - a.length);

function parseRiskLevel(value: string): {
  level: string;
  displayLabel: string;
  note: string;
} | null {
  const trimmed = value.trim();
  const lower = trimmed.toLowerCase();

  for (const alias of SORTED_ALIASES) {
    if (lower.startsWith(alias)) {
      const rest = trimmed.slice(alias.length);
      if (rest.length === 0 || /^\W/.test(rest)) {
        return {
          level: LEVEL_ALIASES[alias],
          displayLabel: trimmed.slice(0, alias.length),
          note: rest
            .replace(/^\s*\(/, "")
            .replace(/\)\s*$/, "")
            .trim(),
        };
      }
    }
  }
  return null;
}

export function RiskLevelBadge({ value }: { value: string }) {
  const parsed = parseRiskLevel(value);
  if (!parsed) return <AutoLinkedText text={value} />;

  const colorClass = RISK_COLORS[parsed.level] ?? "";
  return (
    <span className="inline-flex items-center gap-2">
      <Badge variant="outline" className={colorClass}>
        {parsed.displayLabel.charAt(0).toUpperCase() + parsed.displayLabel.slice(1).toLowerCase()}
      </Badge>
      {parsed.note && <span className="text-xs text-muted-foreground">{parsed.note}</span>}
    </span>
  );
}

export function isRiskSection(items: string[]): boolean {
  return items.some((item) => RISK_LABELS.test(item.split(": ")[0]));
}

export function LegalRiskAssessment({ items }: { items: string[] }) {
  return (
    <div className="mt-4 border-l-4 border-l-primary/50 pl-0">
      <Table>
        <TableBody>
          {items.map((item, i) => {
            const colonIdx = item.indexOf(": ");
            if (colonIdx <= 0) {
              return (
                <TableRow key={i}>
                  <TableCell colSpan={2} className="text-muted-foreground whitespace-normal">
                    <AutoLinkedText text={item} />
                  </TableCell>
                </TableRow>
              );
            }

            const label = item.slice(0, colonIdx);
            const value = item.slice(colonIdx + 2);
            const isRiskLabel = RISK_LABELS.test(label);

            return (
              <TableRow key={i}>
                <TableCell className="w-40 align-top font-medium text-foreground sm:w-48">
                  {label}
                </TableCell>
                <TableCell className="text-muted-foreground whitespace-normal">
                  {isRiskLabel ? <RiskLevelBadge value={value} /> : <AutoLinkedText text={value} />}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
