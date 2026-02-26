"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import type { RoomPreferencesData } from "@openhospi/database/validators";
import { roomPreferencesSchema } from "@openhospi/database/validators";
import {
  GENDER_PREFERENCES,
  GenderPreference,
  LIFESTYLE_TAGS,
  LOCATION_TAGS,
  ROOM_FEATURES,
  VERENIGINGEN,
} from "@openhospi/shared/enums";
import type { LifestyleTag, LocationTag, RoomFeature } from "@openhospi/shared/enums";
import { Check, ChevronsUpDown, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
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
  const tEnums = useTranslations("enums");
  const [isPending, startTransition] = useTransition();

  const form = useForm<RoomPreferencesData>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(roomPreferencesSchema as any),
    defaultValues: {
      features: (defaultValues.features as RoomFeature[]) ?? [],
      locationTags: (defaultValues.locationTags as LocationTag[]) ?? [],
      preferredGender: defaultValues.preferredGender ?? GenderPreference.geen_voorkeur,
      preferredAgeMin: defaultValues.preferredAgeMin ?? undefined,
      preferredAgeMax: defaultValues.preferredAgeMax ?? undefined,
      preferredLifestyleTags: (defaultValues.preferredLifestyleTags as LifestyleTag[]) ?? [],
      roomVereniging: defaultValues.roomVereniging ?? undefined,
    },
  });

  function toggleArrayField<T extends string>(
    name: "features" | "locationTags" | "preferredLifestyleTags",
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

  const selectedFeatures = form.watch("features") ?? [];
  const selectedLocationTags = form.watch("locationTags") ?? [];
  const selectedLifestyleTags = form.watch("preferredLifestyleTags") ?? [];

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="space-y-2">
          <FormLabel>{t("fields.features")}</FormLabel>
          <div className="flex flex-wrap gap-2">
            {ROOM_FEATURES.map((feature) => {
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
            {LOCATION_TAGS.map((tag) => {
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
                  {GENDER_PREFERENCES.map((g) => (
                    <label
                      key={g}
                      className="border-input has-data-[state=checked]:border-primary flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-sm"
                    >
                      <RadioGroupItem value={g} />
                      {tEnums(`gender_preference.${g}`)}
                    </label>
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
          <FormLabel>{t("fields.preferredLifestyleTags")}</FormLabel>
          <div className="flex flex-wrap gap-2">
            {LIFESTYLE_TAGS.map((tag) => {
              const isSelected = selectedLifestyleTags.includes(tag);
              return (
                <Badge
                  key={tag}
                  variant={isSelected ? "default" : "outline"}
                  className={cn(
                    "cursor-pointer select-none px-2.5 py-1 text-xs transition-colors",
                    isSelected && "bg-primary text-primary-foreground",
                  )}
                  onClick={() => toggleArrayField("preferredLifestyleTags", tag)}
                >
                  {tEnums(`lifestyle_tag.${tag}`)}
                </Badge>
              );
            })}
          </div>
        </div>

        <FormField
          control={form.control}
          name="roomVereniging"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>
                {t("fields.roomVereniging")}{" "}
                <span className="text-muted-foreground font-normal">({t("optional")})</span>
              </FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant="outline"
                      role="combobox"
                      className={cn(
                        "w-full justify-between",
                        !field.value && "text-muted-foreground",
                      )}
                    >
                      {field.value
                        ? tEnums(`vereniging.${field.value}`)
                        : t("placeholders.searchVereniging")}
                      <ChevronsUpDown className="ml-2 size-4 shrink-0 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                  <Command>
                    <CommandInput placeholder={t("placeholders.searchVereniging")} />
                    <CommandList>
                      <CommandEmpty>{t("noResults")}</CommandEmpty>
                      <CommandGroup>
                        <CommandItem
                          value="__none__"
                          onSelect={() => {
                            form.setValue("roomVereniging", undefined, { shouldValidate: true });
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 size-4",
                              !field.value ? "opacity-100" : "opacity-0",
                            )}
                          />
                          {t("noSelection")}
                        </CommandItem>
                        {VERENIGINGEN.map((v) => (
                          <CommandItem
                            key={v}
                            value={tEnums(`vereniging.${v}`)}
                            onSelect={() => {
                              form.setValue("roomVereniging", v, { shouldValidate: true });
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 size-4",
                                field.value === v ? "opacity-100" : "opacity-0",
                              )}
                            />
                            {tEnums(`vereniging.${v}`)}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-between">
          <Button variant="outline" type="button" onClick={onBack}>
            {t("actions.back")}
          </Button>
          <Button type="submit" disabled={isPending}>
            {isPending && <Loader2 className="animate-spin" />}
            {t("actions.next")}
          </Button>
        </div>
      </form>
    </Form>
  );
}
