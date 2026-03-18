"use client";

import { MAX_LIFESTYLE_TAGS, MIN_LIFESTYLE_TAGS } from "@openhospi/shared/constants";
import { LifestyleTag } from "@openhospi/shared/enums";
import { personalityStepSchema } from "@openhospi/validators";
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

export function LifestyleCard({ profile }: CardProps) {
  const t = useTranslations("app.profile");
  const tOnboarding = useTranslations("app.onboarding");
  const tEnums = useTranslations("enums");
  const [open, setOpen] = useState(false);
  const { isPending, submit } = useSectionSubmit(profile, () => setOpen(false));

  const form = useForm({
    resolver: zodResolver(personalityStepSchema),
    defaultValues: {
      lifestyleTags: (profile.lifestyleTags as LifestyleTag[]) ?? [],
    },
  });

  const selectedTags = useWatch({ control: form.control, name: "lifestyleTags" }) ?? [];

  function toggleTag(tag: LifestyleTag) {
    const current = form.getValues("lifestyleTags") ?? [];
    if (current.includes(tag)) {
      form.setValue(
        "lifestyleTags",
        current.filter((t) => t !== tag),
        { shouldValidate: true },
      );
    } else if (current.length < MAX_LIFESTYLE_TAGS) {
      form.setValue("lifestyleTags", [...current, tag], { shouldValidate: true });
    }
  }

  const tags = (profile.lifestyleTags as LifestyleTag[]) ?? [];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <SectionCard title={t("lifestyleTags")} onEdit={() => setOpen(true)}>
        {tags.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => (
              <Badge key={tag} variant="secondary">
                {tEnums(`lifestyle_tag.${tag}`)}
              </Badge>
            ))}
          </div>
        ) : (
          <p className="text-sm italic text-muted-foreground">—</p>
        )}
      </SectionCard>

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("editLifestyle")}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(submit)} className="space-y-4">
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">
                {tOnboarding("tagCounter", {
                  count: String(selectedTags.length),
                  min: String(MIN_LIFESTYLE_TAGS),
                  max: String(MAX_LIFESTYLE_TAGS),
                })}
              </p>
              <div className="flex flex-wrap gap-2">
                {LifestyleTag.values.map((tag) => {
                  const isSelected = selectedTags.includes(tag);
                  return (
                    <Badge
                      key={tag}
                      variant={isSelected ? "default" : "outline"}
                      className={cn(
                        "cursor-pointer select-none px-2.5 py-1 text-xs transition-colors",
                        isSelected && "bg-primary text-primary-foreground",
                      )}
                      onClick={() => toggleTag(tag)}
                    >
                      {tEnums(`lifestyle_tag.${tag}`)}
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
