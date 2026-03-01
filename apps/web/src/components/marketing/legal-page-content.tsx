import { getTranslations } from "next-intl/server";
import type { ReactNode } from "react";

import { Separator } from "@/components/ui/separator";

function renderItemText(item: string): ReactNode {
  // "Label — description" pattern (em-dash)
  const dashIdx = item.indexOf(" — ");
  if (dashIdx > 0) {
    return (
      <>
        <strong className="font-medium text-foreground">{item.slice(0, dashIdx)}</strong>
        {" — "}
        {item.slice(dashIdx + 3)}
      </>
    );
  }

  // "Label: value" pattern (colon within first 30 chars)
  const colonIdx = item.indexOf(": ");
  if (colonIdx > 0 && colonIdx < 30) {
    return (
      <>
        <strong className="font-medium text-foreground">{item.slice(0, colonIdx + 1)}</strong>
        {item.slice(colonIdx + 1)}
      </>
    );
  }

  return item;
}

interface LegalPageContentProps {
  locale: string;
  namespace: string;
  sectionCount: number;
  hasIntro?: boolean;
}

export async function LegalPageContent({
  locale,
  namespace,
  sectionCount,
  hasIntro,
}: LegalPageContentProps) {
  const t = await getTranslations({ locale, namespace });

  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{t("title")}</h1>
      <p className="mt-2 text-sm text-muted-foreground">{t("lastUpdated")}</p>

      <Separator className="my-8" />

      {hasIntro && <p className="mb-8 text-muted-foreground leading-relaxed">{t("intro")}</p>}

      <div className="space-y-10">
        {Array.from({ length: sectionCount }, (_, i) => {
          const hasContent = t.has(`sections.${i}.content`);
          const hasItems = t.has(`sections.${i}.items`);
          const rawItems = hasItems ? (t.raw(`sections.${i}.items`) as string[]) : [];

          return (
            <article key={i}>
              <h2 className="text-xl font-semibold">{t(`sections.${i}.title`)}</h2>

              {hasContent && (
                <p className="mt-3 text-muted-foreground leading-relaxed">
                  {t(`sections.${i}.content`)}
                </p>
              )}

              {rawItems.length > 0 && (
                <ul className="mt-3 space-y-2">
                  {rawItems.map((item, j) => (
                    <li
                      key={j}
                      className="flex gap-3 text-sm leading-relaxed text-muted-foreground"
                    >
                      <span className="mt-2 size-1.5 shrink-0 rounded-full bg-primary/40" />
                      <span>{renderItemText(item)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </article>
          );
        })}
      </div>
    </div>
  );
}
