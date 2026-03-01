"use client";

import { LEGAL_HEADER_OFFSET } from "@openhospi/shared/constants";
import { useCallback } from "react";

import { Card, CardContent } from "@/components/ui/card";

interface TocEntry {
  id: string;
  title: string;
}

interface LegalTableOfContentsProps {
  entries: TocEntry[];
  label: string;
}

export function LegalTableOfContents({
  entries,
  label,
}: LegalTableOfContentsProps) {
  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
      e.preventDefault();
      const el = document.getElementById(id);
      if (!el) return;

      const top =
        el.getBoundingClientRect().top + window.scrollY - LEGAL_HEADER_OFFSET;
      window.scrollTo({ top, behavior: "smooth" });
      history.replaceState(null, "", `#${id}`);
    },
    [],
  );

  return (
    <Card className="mb-12 py-4">
      <CardContent className="py-0">
        <p className="mb-3 text-sm font-semibold text-foreground">{label}</p>
        <ol className="space-y-1">
          {entries.map((entry) => (
            <li key={entry.id}>
              <a
                href={`#${entry.id}`}
                onClick={(e) => handleClick(e, entry.id)}
                className="block text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                {entry.title}
              </a>
            </li>
          ))}
        </ol>
      </CardContent>
    </Card>
  );
}
