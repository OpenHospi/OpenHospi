"use client";

import { MAX_LANGUAGES, MIN_LANGUAGES } from "@openhospi/shared/constants";
import { Language } from "@openhospi/shared/enums";
import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { saveLanguagesStep } from "../actions";

type Props = {
  defaultValues: { languages: string[] };
  onBack: () => void;
  onNext: () => void;
};

export function LanguagesStep({ defaultValues, onBack, onNext }: Props) {
  const t = useTranslations("app.onboarding");
  const tCommon = useTranslations("common.labels");
  const tEnums = useTranslations("enums");
  const [isPending, startTransition] = useTransition();
  const [selected, setSelected] = useState<Set<string>>(new Set(defaultValues.languages));

  function toggle(lang: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(lang)) {
        next.delete(lang);
      } else if (next.size < MAX_LANGUAGES) {
        next.add(lang);
      }
      return next;
    });
  }

  function onSubmit() {
    if (selected.size < MIN_LANGUAGES) {
      toast.error(t("validation.minLanguages", { min: MIN_LANGUAGES }));
      return;
    }
    startTransition(async () => {
      const result = await saveLanguagesStep({
        languages: [...selected] as Language[],
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
        {t("languageCounter", {
          count: selected.size,
          min: MIN_LANGUAGES,
          max: MAX_LANGUAGES,
        })}
      </p>

      <div className="flex flex-wrap gap-2">
        {Language.values.map((lang) => {
          const isSelected = selected.has(lang);
          return (
            <Badge
              key={lang}
              variant={isSelected ? "default" : "outline"}
              className={cn(
                "cursor-pointer select-none px-3 py-1.5 text-sm transition-colors",
                isSelected && "bg-primary text-primary-foreground",
              )}
              onClick={() => toggle(lang)}
            >
              {tEnums(`language_enum.${lang}` as any)}
            </Badge>
          );
        })}
      </div>

      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack}>
          {tCommon("back")}
        </Button>
        <Button onClick={onSubmit} disabled={isPending || selected.size < MIN_LANGUAGES}>
          {isPending && <Loader2 className="animate-spin" />}
          {tCommon("next")}
        </Button>
      </div>
    </div>
  );
}
