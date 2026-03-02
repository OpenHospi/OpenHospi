"use client";

import { zodResolver } from "@/lib/form-utils";
import type { RoomPreferencesData } from "@openhospi/database/validators";
import { roomPreferencesSchema } from "@openhospi/database/validators";
import {
  GenderPreference,
  Language,
  LocationTag,
  RoomFeature,
  Vereniging,
} from "@openhospi/shared/enums";
import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useTransition } from "react";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card";
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
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { cn } from "@/lib/utils";

import { savePreferences } from "../actions";

type Props = {
  roomId: string;
  defaultValues: Partial<RoomPreferencesData>;
  onBack: () => void;
  onNext: () => void;
};

export function PreferencesStep({ roomId, defaultValues, onBack, onNext }: Props) {
  const t = useTranslations("app.rooms");
  const tCommon = useTranslations("common.labels");
  const tEnums = useTranslations("enums");
  const [isPending, startTransition] = useTransition();

  const form = useForm<RoomPreferencesData>({
    resolver: zodResolver(roomPreferencesSchema),
    defaultValues: {
      features: (defaultValues.features as RoomFeature[]) ?? [],
      locationTags: (defaultValues.locationTags as LocationTag[]) ?? [],
      preferredGender: defaultValues.preferredGender ?? GenderPreference.no_preference,
      preferredAgeMin: defaultValues.preferredAgeMin ?? undefined,
      preferredAgeMax: defaultValues.preferredAgeMax ?? undefined,
      acceptedLanguages: (defaultValues.acceptedLanguages as Language[]) ?? [],
      roomVereniging: defaultValues.roomVereniging ?? undefined,
    },
  });

  function toggleArrayField<T extends string>(
    name: "features" | "locationTags" | "acceptedLanguages",
    value: T,
  ) {
    const current = (form.getValues(name) as T[]) ?? [];
    if (current.includes(value)) {
      form.setValue(name, current.filter((v) => v !== value) as never, { shouldValidate: true });
    } else {
      form.setValue(name, [...current, value] as never, { shouldValidate: true });
    }
  }

  function onSubmit(data: RoomPreferencesData) {
    startTransition(async () => {
      const result = await savePreferences(roomId, data);
      if (result?.error) {
        toast.error(result.error);
        return;
      }
      onNext();
    });
  }

  const selectedFeatures = useWatch({ control: form.control, name: "features" }) ?? [];
  const selectedLocationTags = useWatch({ control: form.control, name: "locationTags" }) ?? [];
  const selectedLanguages = useWatch({ control: form.control, name: "acceptedLanguages" }) ?? [];

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Features & Location */}
        <Card>
          <CardHeader className="pb-2">
            <p className="text-sm font-medium">{t("wizard.sections.features")}</p>
            <CardDescription>{t("wizard.sectionDescriptions.features")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <FormLabel>{t("fields.features")}</FormLabel>
              <div className="flex flex-wrap gap-2">
                {RoomFeature.values.map((feature) => {
                  const isSelected = selectedFeatures.includes(feature);
                  return (
                    <Badge
                      key={feature}
                      variant={isSelected ? "default" : "outline"}
                      className={cn(
                        "cursor-pointer select-none px-2.5 py-1 text-xs transition-colors",
                        isSelected && "bg-primary text-primary-foreground",
                      )}
                      onClick={() => toggleArrayField("features", feature)}
                    >
                      {tEnums(`room_feature.${feature}`)}
                    </Badge>
                  );
                })}
              </div>
            </div>

            <div className="space-y-2">
              <FormLabel>{t("fields.locationTags")}</FormLabel>
              <div className="flex flex-wrap gap-2">
                {LocationTag.values.map((tag) => {
                  const isSelected = selectedLocationTags.includes(tag);
                  return (
                    <Badge
                      key={tag}
                      variant={isSelected ? "default" : "outline"}
                      className={cn(
                        "cursor-pointer select-none px-2.5 py-1 text-xs transition-colors",
                        isSelected && "bg-primary text-primary-foreground",
                      )}
                      onClick={() => toggleArrayField("locationTags", tag)}
                    >
                      {tEnums(`location_tag.${tag}`)}
                    </Badge>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tenant Preferences */}
        <Card>
          <CardHeader className="pb-2">
            <p className="text-sm font-medium">{t("wizard.sections.preferences")}</p>
            <CardDescription>{t("wizard.sectionDescriptions.preferences")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <FormField
              control={form.control}
              name="preferredGender"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("fields.preferredGender")}</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="flex flex-wrap gap-3"
                    >
                      {GenderPreference.values.map((g) => (
                        <Label
                          key={g}
                          className="border-input has-data-[state=checked]:border-primary flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-sm"
                        >
                          <RadioGroupItem value={g} />
                          {tEnums(`gender_preference.${g}`)}
                        </Label>
                      ))}
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="preferredAgeMin"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("fields.preferredAgeMin")}</FormLabel>
                    <FormControl>
                      <Input type="number" min={16} max={99} {...field} value={field.value ?? ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="preferredAgeMax"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("fields.preferredAgeMax")}</FormLabel>
                    <FormControl>
                      <Input type="number" min={16} max={99} {...field} value={field.value ?? ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="space-y-2">
              <FormLabel>{t("fields.acceptedLanguages")}</FormLabel>
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
                      onClick={() => toggleArrayField("acceptedLanguages", lang)}
                    >
                      {tEnums(`language_enum.${lang}`)}
                    </Badge>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Association */}
        <Card>
          <CardHeader className="pb-2">
            <p className="text-sm font-medium">{t("wizard.sections.association")}</p>
            <CardDescription>{t("wizard.sectionDescriptions.association")}</CardDescription>
          </CardHeader>
          <CardContent>
            <FormField
              control={form.control}
              name="roomVereniging"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {t("fields.roomVereniging")}{" "}
                    <span className="font-normal text-muted-foreground">
                      ({tCommon("optional")})
                    </span>
                  </FormLabel>
                  <Combobox
                    value={field.value ?? null}
                    onValueChange={(val) =>
                      form.setValue("roomVereniging", val ?? undefined, { shouldValidate: true })
                    }
                    items={Vereniging.values}
                    itemToStringLabel={(v) => tEnums(`vereniging.${v}`)}
                  >
                    <ComboboxInput placeholder={t("placeholders.searchVereniging")} showClear />
                    <ComboboxContent>
                      <ComboboxEmpty>{tCommon("noResults")}</ComboboxEmpty>
                      <ComboboxList>
                        {(v) => (
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
          </CardContent>
        </Card>

        <div className="flex justify-between">
          <Button variant="outline" type="button" onClick={onBack}>
            {tCommon("back")}
          </Button>
          <Button type="submit" disabled={isPending}>
            {isPending && <Loader2 className="animate-spin" />}
            {tCommon("next")}
          </Button>
        </div>
      </form>
    </Form>
  );
}
