"use client";

import { useCallback } from "react";

import { Card, CardContent } from "@/components/ui/card";

interface TocEntry {
  id: string;
  title: string;
}

const HEADER_OFFSET = 96;

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
        el.getBoundingClientRect().top + window.scrollY - HEADER_OFFSET;
      window.scrollTo({ top, behavior: "smooth" });
      history.replaceState(null, "", `#${id}`);
    },
    [],
  );

  return (
    <Card className="mb-12 py-4">
      <CardContent className="py-0">
        <p className="mb-3 text-sm font-semibold text-foreground">{label}</p>
        <ol className="columns-1 gap-x-8 space-y-1 sm:columns-2">
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
