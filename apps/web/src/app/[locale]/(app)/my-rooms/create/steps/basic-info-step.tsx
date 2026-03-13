"use client";

import type { RoomBasicInfoData } from "@openhospi/validators";
import { roomBasicInfoSchema } from "@openhospi/validators";
import { MAX_ROOM_DESCRIPTION_LENGTH } from "@openhospi/shared/constants";
import { City } from "@openhospi/shared/enums";
import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useTransition } from "react";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";

import { AddressAutocomplete } from "@/components/shared/address-autocomplete";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
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
import { Textarea } from "@/components/ui/textarea";
import { zodResolver } from "@/lib/form-utils";

import { saveBasicInfo } from "../actions";

type Props = {
  roomId: string;
  defaultValues: Partial<RoomBasicInfoData>;
  onNext: () => void;
};

export function BasicInfoStep({ roomId, defaultValues, onNext }: Props) {
  const t = useTranslations("app.rooms");
  const tCommon = useTranslations("common.labels");
  const tEnums = useTranslations("enums");
  const [isPending, startTransition] = useTransition();

  const form = useForm<RoomBasicInfoData>({
    resolver: zodResolver(roomBasicInfoSchema),
    defaultValues: {
      title: defaultValues.title ?? "",
      description: defaultValues.description ?? "",
      city: defaultValues.city,
      neighborhood: defaultValues.neighborhood ?? "",
      streetName: defaultValues.streetName ?? "",
      houseNumber: defaultValues.houseNumber ?? "",
      postalCode: defaultValues.postalCode ?? "",
      latitude: defaultValues.latitude ?? undefined,
      longitude: defaultValues.longitude ?? undefined,
    },
  });

  const descriptionValue = useWatch({ control: form.control, name: "description" }) ?? "";

  let addressDisplay = "";
  if (defaultValues.streetName) {
    const street = [defaultValues.streetName, defaultValues.houseNumber].filter(Boolean).join(" ");
    addressDisplay = defaultValues.postalCode ? `${street}, ${defaultValues.postalCode}` : street;
  }

  function onSubmit(data: RoomBasicInfoData) {
    startTransition(async () => {
      const result = await saveBasicInfo(roomId, data);
      if (result?.error) {
        toast.error(result.error);
        return;
      }
      onNext();
    });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardContent className="space-y-6 pt-6">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("fields.title")}</FormLabel>
                  <FormControl>
                    <Input placeholder={t("placeholders.title")} {...field} />
                  </FormControl>
                  <FormDescription>{t("wizard.helpers.title")}</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("fields.description")}</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder={t("placeholders.description")}
                      className="min-h-24 resize-none"
                      maxLength={MAX_ROOM_DESCRIPTION_LENGTH}
                      {...field}
                    />
                  </FormControl>
                  <div className="flex items-center justify-between">
                    <FormDescription>{t("wizard.helpers.description")}</FormDescription>
                    <span className="text-xs text-muted-foreground">
                      {descriptionValue.length}/{MAX_ROOM_DESCRIPTION_LENGTH}
                    </span>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-6 pt-6">
            <p className="text-sm font-medium">{t("wizard.sections.location")}</p>

            <FormField
              control={form.control}
              name="city"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("fields.city")}</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {City.values.map((city) => (
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
              name="neighborhood"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {t("fields.neighborhood")}{" "}
                    <span className="font-normal text-muted-foreground">
                      ({tCommon("optional")})
                    </span>
                  </FormLabel>
                  <FormControl>
                    <Input placeholder={t("placeholders.neighborhood")} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-2">
              <FormLabel>{t("fields.address")}</FormLabel>
              <AddressAutocomplete
                defaultDisplayValue={addressDisplay}
                onSelect={(result) => {
                  form.setValue("streetName", result.streetName, { shouldValidate: true });
                  form.setValue("houseNumber", result.houseNumber, { shouldValidate: true });
                  form.setValue("postalCode", result.postalCode, { shouldValidate: true });
                  form.setValue("latitude", result.latitude, { shouldValidate: true });
                  form.setValue("longitude", result.longitude, { shouldValidate: true });
                }}
                onClear={() => {
                  form.setValue("streetName", "", { shouldValidate: true });
                  form.setValue("houseNumber", "", { shouldValidate: true });
                  form.setValue("postalCode", "", { shouldValidate: true });
                  form.setValue("latitude", undefined, { shouldValidate: true });
                  form.setValue("longitude", undefined, { shouldValidate: true });
                }}
                placeholder={t("placeholders.searchAddress")}
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button type="submit" disabled={isPending}>
            {isPending && <Loader2 className="animate-spin" />}
            {tCommon("next")}
          </Button>
        </div>
      </form>
    </Form>
  );
}
