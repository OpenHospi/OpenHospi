"use client";

import { Vereniging } from "@openhospi/shared/enums";
import type { EditProfileData } from "@openhospi/validators";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { CitySearchInput } from "@/components/shared/city-search-input";
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Form, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { zodResolver } from "@/lib/form-utils";

import type { CardProps } from "./dialog-helpers";
import { DialogFooter, SectionCard, useSectionSubmit } from "./dialog-helpers";

const preferencesFormSchema = z.object({
  preferredCity: z.string().max(255).optional(),
  vereniging: z.enum(Vereniging.values).optional(),
});

type PreferencesFormData = z.infer<typeof preferencesFormSchema>;

export function PreferencesCard({ profile }: CardProps) {
  const t = useTranslations("app.profile");
  const tCommon = useTranslations("common.labels");
  const tOnboarding = useTranslations("app.onboarding");
  const tEnums = useTranslations("enums");
  const [open, setOpen] = useState(false);
  const { isPending, submit } = useSectionSubmit(profile, () => setOpen(false));

  const form = useForm<PreferencesFormData>({
    resolver: zodResolver(preferencesFormSchema),
    defaultValues: {
      preferredCity: (profile.preferredCity as EditProfileData["preferredCity"]) ?? undefined,
      vereniging: (profile.vereniging as EditProfileData["vereniging"]) ?? undefined,
    },
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <SectionCard title={t("preferences")} onEdit={() => setOpen(true)}>
        <dl className="space-y-2 text-sm">
          {profile.preferredCity && (
            <div>
              <dt className="text-muted-foreground">{t("preferredCity")}</dt>
              <dd>{profile.preferredCity}</dd>
            </div>
          )}
          {profile.vereniging && (
            <div>
              <dt className="text-muted-foreground">{tOnboarding("fields.vereniging")}</dt>
              <dd>{tEnums(`vereniging.${profile.vereniging}`)}</dd>
            </div>
          )}
        </dl>
      </SectionCard>

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("editPreferences")}</DialogTitle>
          <DialogDescription className="sr-only">{t("editPreferences")}</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(submit)} className="space-y-4">
            <FormField
              control={form.control}
              name="preferredCity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{tOnboarding("fields.preferredCity")}</FormLabel>
                  <CitySearchInput
                    value={field.value ?? ""}
                    onSelect={field.onChange}
                    placeholder={tOnboarding("placeholders.preferredCity")}
                  />
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="vereniging"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{tOnboarding("fields.vereniging")}</FormLabel>
                  <Combobox
                    value={field.value ?? null}
                    onValueChange={(val) =>
                      form.setValue("vereniging", val ?? undefined, { shouldValidate: true })
                    }
                    items={Vereniging.values}
                    itemToStringLabel={(v: Vereniging) => tEnums(`vereniging.${v}`)}
                  >
                    <ComboboxInput
                      placeholder={tOnboarding("placeholders.searchVereniging")}
                      showClear
                    />
                    <ComboboxContent>
                      <ComboboxEmpty>{tCommon("noResults")}</ComboboxEmpty>
                      <ComboboxList>
                        {(v: Vereniging) => (
                          <ComboboxItem key={v} value={v}>
                            {tEnums(`vereniging.${v}`)}
                          </ComboboxItem>
                        )}
                      </ComboboxList>
                    </ComboboxContent>
                  </Combobox>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter isPending={isPending} onCancel={() => setOpen(false)} />
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
