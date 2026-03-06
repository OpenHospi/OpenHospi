"use client";

import { languagesStepSchema } from "@openhospi/database/validators";
import { MAX_LANGUAGES, MIN_LANGUAGES } from "@openhospi/shared/constants";
import { Language } from "@openhospi/shared/enums";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";

import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form } from "@/components/ui/form";
import { zodResolver } from "@/lib/form-utils";
import { cn } from "@/lib/utils";

import type { CardProps } from "./dialog-helpers";
import { DialogFooter, SectionCard, useSectionSubmit } from "./dialog-helpers";

export function LanguagesCard({ profile }: CardProps) {
  const t = useTranslations("app.profile");
  const tOnboarding = useTranslations("app.onboarding");
  const tEnums = useTranslations("enums");
  const [open, setOpen] = useState(false);
  const { isPending, submit } = useSectionSubmit(profile, () => setOpen(false));

  const form = useForm({
    resolver: zodResolver(languagesStepSchema),
    defaultValues: {
      languages: (profile.languages as Language[]) ?? [],
    },
  });

  const selectedLanguages = useWatch({ control: form.control, name: "languages" }) ?? [];

  function toggleLanguage(lang: Language) {
    const current = form.getValues("languages") ?? [];
    if (current.includes(lang)) {
      form.setValue(
        "languages",
        current.filter((l) => l !== lang),
        { shouldValidate: true },
      );
    } else if (current.length < MAX_LANGUAGES) {
      form.setValue("languages", [...current, lang], { shouldValidate: true });
    }
  }

  const languages = (profile.languages as Language[]) ?? [];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <SectionCard title={t("languages")} onEdit={() => setOpen(true)}>
        {languages.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {languages.map((lang) => (
              <Badge key={lang} variant="secondary">
                {tEnums(`language_enum.${lang}`)}
              </Badge>
            ))}
          </div>
        ) : (
          <p className="text-sm italic text-muted-foreground">—</p>
        )}
      </SectionCard>

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("editLanguages")}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(submit)} className="space-y-4">
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">
                {tOnboarding("languageCounter", {
                  count: String(selectedLanguages.length),
                  min: String(MIN_LANGUAGES),
                  max: String(MAX_LANGUAGES),
                })}
              </p>
              <div className="flex flex-wrap gap-2">
                {Language.values.map((lang) => {
                  const isSelected = selectedLanguages.includes(lang);
                  return (
                    <Badge
                      key={lang}
                      variant={isSelected ? "default" : "outline"}
                      className={cn(
                        "cursor-pointer select-none px-2.5 py-1 text-xs transition-colors",
                        isSelected && "bg-primary text-primary-foreground",
                      )}
                      onClick={() => toggleLanguage(lang)}
                    >
                      {tEnums(`language_enum.${lang}`)}
                    </Badge>
                  );
                })}
              </div>
            </div>
            <DialogFooter isPending={isPending} onCancel={() => setOpen(false)} />
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
