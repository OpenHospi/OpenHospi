import { getTranslations } from "next-intl/server";

import { Separator } from "@/components/ui/separator";

import { isRiskSection } from "./legal-risk-badge";
import { LegalSection, type SectionMode } from "./legal-section";
import { LegalTableOfContents } from "./legal-toc";

interface LegalPageContentProps {
  locale: string;
  namespace: string;
  hasIntro?: boolean;
}

const CARD_NAMESPACES = new Set(["dataProcessors", "processingRegister"]);

function getSectionMode(
  namespace: string,
  items: string[],
): SectionMode {
  if (CARD_NAMESPACES.has(namespace)) return "card";
  if (namespace === "dpia" && items.length > 0 && isRiskSection(items))
    return "risk";
  return "prose";
}

export async function LegalPageContent({
  locale,
  namespace,
  hasIntro,
}: LegalPageContentProps) {
  const t = await getTranslations({ locale, namespace });
  const tCommon = await getTranslations({
    locale,
    namespace: "common.labels",
  });
  const sections = t.raw("sections") as unknown[];

  // Build section data
  const sectionData = sections.map((_, i) => {
    const hasContent = t.has(`sections.${i}.content`);
    const hasItems = t.has(`sections.${i}.items`);
    const items = hasItems ? (t.raw(`sections.${i}.items`) as string[]) : [];
    const title = t(`sections.${i}.title`);

    return {
      id: `section-${i}`,
      title,
      linkAriaLabel: tCommon("linkToSection", { title }),
      content: hasContent ? t(`sections.${i}.content`) : undefined,
      items,
      mode: getSectionMode(namespace, items),
    };
  });

  const tocEntries = sectionData.map(({ id, title }) => ({ id, title }));

  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
        {t("title")}
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">{t("lastUpdated")}</p>

      <Separator className="my-8" />

      {hasIntro && (
        <p className="mb-8 leading-relaxed text-muted-foreground">
          {t("intro")}
        </p>
      )}

      {tocEntries.length > 3 && (
        <LegalTableOfContents
          entries={tocEntries}
          label={tCommon("onThisPage")}
        />
      )}

      <div className="space-y-10">
        {sectionData.map((section) => (
          <LegalSection key={section.id} {...section} />
        ))}
      </div>
    </div>
  );
}
