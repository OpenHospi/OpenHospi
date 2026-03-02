"use client";

import type { PreferencesStepData } from "@openhospi/database/validators";
import { preferencesStepSchema } from "@openhospi/database/validators";
import { City, Vereniging } from "@openhospi/shared/enums";
import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { zodResolver } from "@/lib/form-utils";

import { finishOnboarding, savePreferencesStep } from "../actions";

type Props = {
  defaultValues: Partial<PreferencesStepData>;
  onBack: () => void;
};

export function PreferencesStep({ defaultValues, onBack }: Props) {
  const t = useTranslations("app.onboarding");
  const tCommon = useTranslations("common.labels");
  const tEnums = useTranslations("enums");
  const [isPending, startTransition] = useTransition();

  const form = useForm<PreferencesStepData>({
    resolver: zodResolver(preferencesStepSchema),
    defaultValues: {
      preferredCity: defaultValues.preferredCity,
      maxRent: defaultValues.maxRent ?? undefined,
      availableFrom: defaultValues.availableFrom ?? "",
      vereniging: defaultValues.vereniging ?? undefined,
    },
  });

  function onSubmit(data: PreferencesStepData) {
    startTransition(async () => {
      const saveResult = await savePreferencesStep(data);
      if (saveResult?.error) {
        toast.error(saveResult.error);
        return;
      }

      await finishOnboarding();
    });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="preferredCity"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("fields.preferredCity")}</FormLabel>
              <Combobox
                value={field.value ?? null}
                onValueChange={field.onChange}
                items={City.values}
                itemToStringLabel={(city: City) => tEnums(`city.${city}`)}
              >
                <ComboboxInput placeholder={t("placeholders.preferredCity")} />
                <ComboboxContent>
                  <ComboboxEmpty>{tCommon("noResults")}</ComboboxEmpty>
                  <ComboboxList>
                    {(city: City) => (
                      <ComboboxItem key={city} value={city}>
                        {tEnums(`city.${city}`)}
                      </ComboboxItem>
                    )}
                  </ComboboxList>
                </ComboboxContent>
              </Combobox>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="maxRent"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                {t("fields.maxRent")}{" "}
                <span className="text-muted-foreground font-normal">({tCommon("optional")})</span>
              </FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min={0}
                  max={5000}
                  placeholder={t("placeholders.maxRent")}
                  {...field}
                  value={field.value ?? ""}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="availableFrom"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("fields.availableFrom")}</FormLabel>
              <FormControl>
                <Input type="date" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="vereniging"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                {t("fields.vereniging")}{" "}
                <span className="text-muted-foreground font-normal">({tCommon("optional")})</span>
              </FormLabel>
              <Combobox
                value={field.value ?? null}
                onValueChange={(val) =>
                  form.setValue("vereniging", val ?? undefined, { shouldValidate: true })
                }
                items={Vereniging.values}
                itemToStringLabel={(v: Vereniging) => tEnums(`vereniging.${v}`)}
              >
                <ComboboxInput placeholder={t("placeholders.searchVereniging")} showClear />
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

        <div className="flex justify-between">
          <Button variant="outline" type="button" onClick={onBack}>
            {tCommon("back")}
          </Button>
          <Button type="submit" disabled={isPending}>
            {isPending && <Loader2 className="animate-spin" />}
            {t("complete")}
          </Button>
        </div>
      </form>
    </Form>
  );
}
