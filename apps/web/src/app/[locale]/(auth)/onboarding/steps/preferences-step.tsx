"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { CITIES } from "@openhospi/shared/enums";
import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import type { PreferencesStepData } from "@/lib/schemas/profile";
import { preferencesStepSchema } from "@/lib/schemas/profile";

import { finishOnboarding, savePreferencesStep } from "../actions";

type Props = {
  defaultValues: Partial<PreferencesStepData>;
  onBack: () => void;
};

export function PreferencesStep({ defaultValues, onBack }: Props) {
  const t = useTranslations("app.onboarding");
  const tEnums = useTranslations("enums");
  const [isPending, startTransition] = useTransition();

  const form = useForm<PreferencesStepData>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(preferencesStepSchema as any),
    defaultValues: {
      preferred_city: defaultValues.preferred_city,
      max_rent: defaultValues.max_rent ?? undefined,
      available_from: defaultValues.available_from ?? "",
      vereniging: defaultValues.vereniging ?? "",
      instagram_handle: defaultValues.instagram_handle ?? "",
      show_instagram: defaultValues.show_instagram ?? false,
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
          name="preferred_city"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("fields.preferredCity")}</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder={t("placeholders.preferredCity")} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {CITIES.map((city) => (
                    <SelectItem key={city} value={city}>
                      {tEnums(`city.${city}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="max_rent"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                {t("fields.maxRent")}{" "}
                <span className="text-muted-foreground font-normal">({t("optional")})</span>
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
          name="available_from"
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
                <span className="text-muted-foreground font-normal">({t("optional")})</span>
              </FormLabel>
              <FormControl>
                <Input placeholder={t("placeholders.vereniging")} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="instagram_handle"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                {t("fields.instagram")}{" "}
                <span className="text-muted-foreground font-normal">({t("optional")})</span>
              </FormLabel>
              <FormControl>
                <Input placeholder="@username" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="show_instagram"
          render={({ field }) => (
            <FormItem className="flex items-center justify-between rounded-lg border p-3">
              <FormLabel className="cursor-pointer">{t("fields.showInstagram")}</FormLabel>
              <FormControl>
                <Switch checked={field.value} onCheckedChange={field.onChange} />
              </FormControl>
            </FormItem>
          )}
        />

        <div className="flex justify-between">
          <Button variant="outline" type="button" onClick={onBack}>
            {t("back")}
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
