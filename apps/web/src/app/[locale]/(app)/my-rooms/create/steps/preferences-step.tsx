"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  GENDER_PREFERENCES,
  LIFESTYLE_TAGS,
  LOCATION_TAGS,
  ROOM_FEATURES,
} from "@openhospi/shared/enums";
import type { LifestyleTag, LocationTag, RoomFeature } from "@openhospi/shared/enums";
import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import type { RoomPreferencesData } from "@/lib/schemas/room";
import { roomPreferencesSchema } from "@/lib/schemas/room";
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
      location_tags: (defaultValues.location_tags as LocationTag[]) ?? [],
      preferred_gender: defaultValues.preferred_gender ?? "geen_voorkeur",
      preferred_age_min: defaultValues.preferred_age_min ?? undefined,
      preferred_age_max: defaultValues.preferred_age_max ?? undefined,
      preferred_lifestyle_tags: (defaultValues.preferred_lifestyle_tags as LifestyleTag[]) ?? [],
      is_verenigingshuis: defaultValues.is_verenigingshuis ?? false,
      room_vereniging: defaultValues.room_vereniging ?? "",
    },
  });

  const isVerenigingshuis = form.watch("is_verenigingshuis");

  function toggleArrayField<T extends string>(
    name: "features" | "location_tags" | "preferred_lifestyle_tags",
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
  const selectedLocationTags = form.watch("location_tags") ?? [];
  const selectedLifestyleTags = form.watch("preferred_lifestyle_tags") ?? [];

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
                  onClick={() => toggleArrayField("location_tags", tag)}
                >
                  {tEnums(`location_tag.${tag}`)}
                </Badge>
              );
            })}
          </div>
        </div>

        <FormField
          control={form.control}
          name="preferred_gender"
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
            name="preferred_age_min"
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
            name="preferred_age_max"
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
                  onClick={() => toggleArrayField("preferred_lifestyle_tags", tag)}
                >
                  {tEnums(`lifestyle_tag.${tag}`)}
                </Badge>
              );
            })}
          </div>
        </div>

        <FormField
          control={form.control}
          name="is_verenigingshuis"
          render={({ field }) => (
            <FormItem className="flex items-center justify-between rounded-lg border p-3">
              <FormLabel className="cursor-pointer">{t("fields.isVerenigingshuis")}</FormLabel>
              <FormControl>
                <Switch checked={field.value} onCheckedChange={field.onChange} />
              </FormControl>
            </FormItem>
          )}
        />

        {isVerenigingshuis && (
          <FormField
            control={form.control}
            name="room_vereniging"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("fields.roomVereniging")}</FormLabel>
                <FormControl>
                  <Input placeholder={t("placeholders.roomVereniging")} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

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
