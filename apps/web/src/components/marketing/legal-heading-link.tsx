"use client";

import { useCallback } from "react";

import { Link as LinkIcon } from "lucide-react";

const HEADER_OFFSET = 96;

export function LegalHeadingLink({ id, title }: { id: string; title: string }) {
  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLAnchorElement>) => {
      e.preventDefault();
      const el = document.getElementById(id);
      if (!el) return;

      const top =
        el.getBoundingClientRect().top + window.scrollY - HEADER_OFFSET;
      window.scrollTo({ top, behavior: "smooth" });
      history.replaceState(null, "", `#${id}`);
    },
    [id],
  );

  return (
    <h2 className="group flex items-center gap-2 text-xl font-semibold">
      {title}
      <a
        href={`#${id}`}
        onClick={handleClick}
        aria-label={`Link to ${title}`}
        className="text-muted-foreground/0 transition-colors group-hover:text-muted-foreground"
      >
        <LinkIcon className="size-4" />
      </a>
    </h2>
  );
}
