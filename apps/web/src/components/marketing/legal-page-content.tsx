import type {Locale} from "@openhospi/i18n";
import {getTranslations} from "next-intl/server";

import {Separator} from "@/components/ui/separator";

import {isRiskSection} from "./legal-risk-badge";
import {LegalSection, type SectionMode} from "./legal-section";
import {LegalTableOfContents} from "./legal-toc";

type LegalNamespace =
    | "privacy"
    | "cookies"
    | "terms"
    | "legalBasis"
    | "dataProcessors"
    | "processingRegister"
    | "dpia";

interface LegalPageContentProps {
    locale: Locale;
    namespace: LegalNamespace;
    hasIntro?: boolean;
}

const CARD_NAMESPACES = new Set(["dataProcessors", "processingRegister"]);

function getSectionMode(namespace: string, items: string[]): SectionMode {
    if (CARD_NAMESPACES.has(namespace)) return "card";
    if (namespace === "dpia" && items.length > 0 && isRiskSection(items)) return "risk";
    return "prose";
}

export async function LegalPageContent({locale, namespace, hasIntro}: LegalPageContentProps) {
    const t = await getTranslations({locale, namespace});
    const tCommon = await getTranslations({
        locale,
        namespace: "common.labels",
    });
    const sections = t.raw("sections") as unknown[];

    // Build section data
    const sectionData = sections.map((_, i) => {
        const titleKey = `sections.${i}.title` as Parameters<typeof t>[0];
        const contentKey = `sections.${i}.content` as Parameters<typeof t>[0];
        const itemsKey = `sections.${i}.items` as Parameters<typeof t.raw>[0];
        const hasContent = t.has(contentKey);
        const hasItems = t.has(itemsKey);
        const items = hasItems ? (t.raw(itemsKey) as string[]) : [];
        const title = t(titleKey);

        return {
            id: `section-${i}`,
            title,
            linkAriaLabel: tCommon("linkToSection", {title}),
            content: hasContent ? t(contentKey) : undefined,
            items,
            mode: getSectionMode(namespace, items),
        };
    });

    const tocEntries = sectionData.map(({id, title}) => ({id, title}));

    return (
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{t("title")}</h1>
            <p className="mt-2 text-sm text-muted-foreground">{t("lastUpdated")}</p>

            <Separator className="my-8"/>

            {hasIntro && <p className="mb-8 leading-relaxed text-muted-foreground">{t("intro")}</p>}

            {tocEntries.length > 3 && (
                <LegalTableOfContents entries={tocEntries} label={tCommon("onThisPage")}/>
            )}

            <div className="space-y-10">
                {sectionData.map((section) => (
                    <LegalSection key={section.id} {...section} />
                ))}
            </div>
        </div>
    );
}
