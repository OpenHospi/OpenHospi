"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface FaqItem {
  question: string;
  answer: string;
}

interface FaqCategory {
  name: string;
  items: FaqItem[];
}

interface FaqTabsProps {
  categories: FaqCategory[];
  allTab: string;
}

function FaqAccordion({ items, keyPrefix }: { items: FaqItem[]; keyPrefix: string }) {
  return (
    <Accordion type="multiple" className="w-full">
      {items.map((item, i) => (
        <AccordionItem key={`${keyPrefix}-${i}`} value={`${keyPrefix}-${i}`}>
          <AccordionTrigger>{item.question}</AccordionTrigger>
          <AccordionContent>{item.answer}</AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}

export function FaqTabs({ categories, allTab }: FaqTabsProps) {
  const allItems = categories.flatMap((cat, catIdx) =>
    cat.items.map((item) => ({ ...item, catIdx })),
  );

  return (
    <Tabs defaultValue="all" className="mx-auto max-w-3xl">
      <div className="overflow-x-auto pb-2">
        <TabsList className="inline-flex w-auto min-w-full sm:min-w-0">
          <TabsTrigger value="all">{allTab}</TabsTrigger>
          {categories.map((cat, i) => (
            <TabsTrigger key={i} value={`cat-${i}`}>
              {cat.name}
            </TabsTrigger>
          ))}
        </TabsList>
      </div>

      <TabsContent value="all" className="mt-6">
        <FaqAccordion items={allItems} keyPrefix="all" />
      </TabsContent>

      {categories.map((cat, i) => (
        <TabsContent key={i} value={`cat-${i}`} className="mt-6">
          <FaqAccordion items={cat.items} keyPrefix={`cat-${i}`} />
        </TabsContent>
      ))}
    </Tabs>
  );
}
