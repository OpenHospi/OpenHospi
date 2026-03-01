import type {ReactNode} from "react";

import {AutoLinkedText} from "./legal-auto-link";
import {LegalHeadingLink} from "./legal-heading-link";
import {LegalRiskAssessment} from "./legal-risk-badge";
import {LegalStructuredCards} from "./legal-structured-card";

export type SectionMode = "prose" | "card" | "risk";

function renderItemText(item: string): ReactNode {
    // "Label — description" pattern (em-dash)
    const dashIdx = item.indexOf(" — ");
    if (dashIdx > 0) {
        return (
            <>
                <strong className="font-medium text-foreground">
                    {item.slice(0, dashIdx)}
                </strong>
                {" — "}
                <AutoLinkedText text={item.slice(dashIdx + 3)}/>
            </>
        );
    }

    // "Label: value" pattern (colon within first 30 chars)
    const colonIdx = item.indexOf(": ");
    if (colonIdx > 0 && colonIdx < 30) {
        return (
            <>
                <strong className="font-medium text-foreground">
                    {item.slice(0, colonIdx + 1)}
                </strong>
                {" "}
                <AutoLinkedText text={item.slice(colonIdx + 2)}/>
            </>
        );
    }

    return <AutoLinkedText text={item}/>;
}

interface LegalSectionProps {
    id: string;
    title: string;
    content?: string;
    items: string[];
    mode: SectionMode;
}

export function LegalSection({
                                 id,
                                 title,
                                 content,
                                 items,
                                 mode,
                             }: LegalSectionProps) {
    return (
        <article id={id} data-legal-section className="scroll-mt-24">
            <LegalHeadingLink id={id} title={title}/>

            {content && (
                <p className="mt-3 leading-relaxed text-muted-foreground">
                    <AutoLinkedText text={content}/>
                </p>
            )}

            {items.length > 0 && mode === "card" && (
                <LegalStructuredCards items={items}/>
            )}

            {items.length > 0 && mode === "risk" && (
                <LegalRiskAssessment items={items}/>
            )}

            {items.length > 0 && mode === "prose" && (
                <ul className="mt-3 space-y-2">
                    {items.map((item, j) => (
                        <li
                            key={j}
                            className="flex gap-3 text-sm leading-relaxed text-muted-foreground"
                        >
                            <span className="mt-2 size-1.5 shrink-0 rounded-full bg-primary/40"/>
                            <span>{renderItemText(item)}</span>
                        </li>
                    ))}
                </ul>
            )}
        </article>
    );
}
