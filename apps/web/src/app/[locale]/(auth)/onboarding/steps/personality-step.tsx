"use client";

import { MAX_LIFESTYLE_TAGS, MIN_LIFESTYLE_TAGS } from "@openhospi/shared/constants";
import { LIFESTYLE_TAGS } from "@openhospi/shared/enums";
import type { LifestyleTag } from "@openhospi/shared/enums";
import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { savePersonalityStep } from "../actions";

type Props = {
  defaultValues: { lifestyle_tags: string[] };
  onBack: () => void;
  onNext: () => void;
};

export function PersonalityStep({ defaultValues, onBack, onNext }: Props) {
  const t = useTranslations("app.onboarding");
  const tEnums = useTranslations("enums");
  const [isPending, startTransition] = useTransition();
  const [selected, setSelected] = useState<Set<string>>(new Set(defaultValues.lifestyle_tags));

  function toggle(tag: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(tag)) {
        next.delete(tag);
      } else if (next.size < MAX_LIFESTYLE_TAGS) {
        next.add(tag);
      }
      return next;
    });
  }

  function onSubmit() {
    if (selected.size < MIN_LIFESTYLE_TAGS) {
      toast.error(t("validation.minTags", { min: MIN_LIFESTYLE_TAGS }));
      return;
    }
    startTransition(async () => {
      const result = await savePersonalityStep({
        lifestyle_tags: [...selected] as LifestyleTag[],
      });
      if (result?.error) {
        toast.error(result.error);
        return;
      }
      onNext();
    });
  }

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        {t("tagCounter", {
          count: selected.size,
          min: MIN_LIFESTYLE_TAGS,
          max: MAX_LIFESTYLE_TAGS,
        })}
      </p>

      <div className="flex flex-wrap gap-2">
        {LIFESTYLE_TAGS.map((tag) => {
          const isSelected = selected.has(tag);
          return (
            <Badge
              key={tag}
              variant={isSelected ? "default" : "outline"}
              className={cn(
                "cursor-pointer select-none px-3 py-1.5 text-sm transition-colors",
                isSelected && "bg-primary text-primary-foreground",
              )}
              onClick={() => toggle(tag)}
            >
              {tEnums(`lifestyle_tag.${tag}`)}
            </Badge>
          );
        })}
      </div>

      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack}>
          {t("back")}
        </Button>
        <Button onClick={onSubmit} disabled={isPending || selected.size < MIN_LIFESTYLE_TAGS}>
          {isPending && <Loader2 className="animate-spin" />}
          {t("next")}
        </Button>
      </div>
    </div>
  );
}
