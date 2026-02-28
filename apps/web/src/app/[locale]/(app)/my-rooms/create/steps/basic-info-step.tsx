"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import type { RoomBasicInfoData } from "@openhospi/database/validators";
import { roomBasicInfoSchema } from "@openhospi/database/validators";
import { City } from "@openhospi/shared/enums";
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
import { Textarea } from "@/components/ui/textarea";

import { saveBasicInfo } from "../actions";

type Props = {
  roomId: string;
  defaultValues: Partial<RoomBasicInfoData>;
  onNext: () => void;
};

export function BasicInfoStep({ roomId, defaultValues, onNext }: Props) {
  const t = useTranslations("app.rooms");
  const tEnums = useTranslations("enums");
  const [isPending, startTransition] = useTransition();

  const form = useForm<RoomBasicInfoData>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(roomBasicInfoSchema as any),
    defaultValues: {
      title: defaultValues.title ?? "",
      description: defaultValues.description ?? "",
      city: defaultValues.city,
      neighborhood: defaultValues.neighborhood ?? "",
      address: defaultValues.address ?? "",
    },
  });

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
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("fields.title")}</FormLabel>
              <FormControl>
                <Input placeholder={t("placeholders.title")} {...field} />
              </FormControl>
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
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

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
                <span className="text-muted-foreground font-normal">
                  ({t("wizard.stepDescriptions.step1")})
                </span>
              </FormLabel>
              <FormControl>
                <Input placeholder={t("placeholders.neighborhood")} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="address"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("fields.address")}</FormLabel>
              <FormControl>
                <Input placeholder={t("placeholders.address")} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end">
          <Button type="submit" disabled={isPending}>
            {isPending && <Loader2 className="animate-spin" />}
            {t("actions.next")}
          </Button>
        </div>
      </form>
    </Form>
  );
}
