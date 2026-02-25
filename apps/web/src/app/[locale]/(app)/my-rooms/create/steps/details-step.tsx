"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { FURNISHINGS, HOUSE_TYPES, RENTAL_TYPES } from "@openhospi/shared/enums";
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import type { RoomDetailsData } from "@/lib/schemas/room";
import { roomDetailsSchema } from "@/lib/schemas/room";

import { saveDetails } from "../actions";

type Props = {
  roomId: string;
  defaultValues: Partial<RoomDetailsData>;
  onBack: () => void;
  onNext: () => void;
};

export function DetailsStep({ roomId, defaultValues, onBack, onNext }: Props) {
  const t = useTranslations("app.rooms");
  const tEnums = useTranslations("enums");
  const [isPending, startTransition] = useTransition();

  const form = useForm<RoomDetailsData>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(roomDetailsSchema as any),
    defaultValues: {
      rent_price: defaultValues.rent_price ?? undefined,
      deposit: defaultValues.deposit ?? undefined,
      utilities_included: defaultValues.utilities_included ?? false,
      room_size_m2: defaultValues.room_size_m2 ?? undefined,
      available_from: defaultValues.available_from ?? "",
      available_until: defaultValues.available_until ?? "",
      rental_type: defaultValues.rental_type ?? "vast",
      house_type: defaultValues.house_type,
      furnishing: defaultValues.furnishing,
      total_housemates: defaultValues.total_housemates ?? undefined,
    },
  });

  const rentalType = form.watch("rental_type");

  function onSubmit(data: RoomDetailsData) {
    startTransition(async () => {
      const result = await saveDetails(roomId, data);
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
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="rent_price"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("fields.rentPrice")}</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min={0}
                    placeholder={t("placeholders.rentPrice")}
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
            name="deposit"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("fields.deposit")}</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min={0}
                    placeholder={t("placeholders.deposit")}
                    {...field}
                    value={field.value ?? ""}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="utilities_included"
          render={({ field }) => (
            <FormItem className="flex items-center justify-between rounded-lg border p-3">
              <FormLabel className="cursor-pointer">{t("fields.utilitiesIncluded")}</FormLabel>
              <FormControl>
                <Switch checked={field.value} onCheckedChange={field.onChange} />
              </FormControl>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="room_size_m2"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("fields.roomSize")}</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min={1}
                  placeholder={t("placeholders.roomSize")}
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
          name="rental_type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("fields.rentalType")}</FormLabel>
              <FormControl>
                <RadioGroup
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  className="flex flex-wrap gap-3"
                >
                  {RENTAL_TYPES.map((type) => (
                    <label
                      key={type}
                      className="border-input has-data-[state=checked]:border-primary flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-sm"
                    >
                      <RadioGroupItem value={type} />
                      {tEnums(`rental_type.${type}`)}
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

          {rentalType !== "vast" && (
            <FormField
              control={form.control}
              name="available_until"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("fields.availableUntil")}</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
        </div>

        <FormField
          control={form.control}
          name="house_type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("fields.houseType")}</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {HOUSE_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {tEnums(`house_type.${type}`)}
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
          name="furnishing"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("fields.furnishing")}</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {FURNISHINGS.map((f) => (
                    <SelectItem key={f} value={f}>
                      {tEnums(`furnishing.${f}`)}
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
          name="total_housemates"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("fields.totalHousemates")}</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min={1}
                  placeholder={t("placeholders.totalHousemates")}
                  {...field}
                  value={field.value ?? ""}
                />
              </FormControl>
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
