"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import type { RoomDetailsData } from "@openhospi/database/validators";
import { roomDetailsSchema } from "@openhospi/database/validators";
import { Furnishing, HouseType, RentalType, UtilitiesIncluded } from "@openhospi/shared/enums";
import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

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
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupText,
} from "@/components/ui/input-group";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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
      rentPrice: defaultValues.rentPrice ?? undefined,
      deposit: defaultValues.deposit ?? undefined,
      utilitiesIncluded: defaultValues.utilitiesIncluded ?? UtilitiesIncluded.included,
      serviceCosts: defaultValues.serviceCosts ?? undefined,
      estimatedUtilitiesCosts: defaultValues.estimatedUtilitiesCosts ?? undefined,
      roomSizeM2: defaultValues.roomSizeM2 ?? undefined,
      availableFrom: defaultValues.availableFrom ?? "",
      availableUntil: defaultValues.availableUntil ?? "",
      rentalType: defaultValues.rentalType ?? RentalType.permanent,
      houseType: defaultValues.houseType,
      furnishing: defaultValues.furnishing,
      totalHousemates: defaultValues.totalHousemates ?? undefined,
    },
  });

  const rentalType = form.watch("rentalType");
  const utilitiesIncluded = form.watch("utilitiesIncluded");

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
        {/* Pricing Section */}
        <Card>
          <CardContent className="space-y-6 pt-6">
            <p className="text-sm font-medium">{t("wizard.sections.pricing")}</p>

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="rentPrice"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("fields.rentPrice")}</FormLabel>
                    <FormControl>
                      <InputGroup>
                        <InputGroupAddon>
                          <InputGroupText>&euro;</InputGroupText>
                        </InputGroupAddon>
                        <InputGroupInput
                          type="number"
                          min={0}
                          placeholder={t("placeholders.rentPrice")}
                          {...field}
                          value={field.value ?? ""}
                        />
                      </InputGroup>
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
                      <InputGroup>
                        <InputGroupAddon>
                          <InputGroupText>&euro;</InputGroupText>
                        </InputGroupAddon>
                        <InputGroupInput
                          type="number"
                          min={0}
                          placeholder={t("placeholders.deposit")}
                          {...field}
                          value={field.value ?? ""}
                        />
                      </InputGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="serviceCosts"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("fields.serviceCosts")}</FormLabel>
                  <FormControl>
                    <InputGroup>
                      <InputGroupAddon>
                        <InputGroupText>&euro;</InputGroupText>
                      </InputGroupAddon>
                      <InputGroupInput
                        type="number"
                        min={0}
                        placeholder={t("placeholders.serviceCosts")}
                        {...field}
                        value={field.value ?? ""}
                      />
                    </InputGroup>
                  </FormControl>
                  <FormDescription>{t("helpers.serviceCosts")}</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="utilitiesIncluded"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("fields.utilitiesIncluded")}</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={(value) => {
                        field.onChange(value);
                        if (value !== UtilitiesIncluded.estimated) {
                          form.setValue("estimatedUtilitiesCosts", undefined);
                        }
                      }}
                      value={field.value}
                      className="space-y-2"
                    >
                      {UtilitiesIncluded.values.map((option) => (
                        <Label
                          key={option}
                          className="border-input has-data-[state=checked]:border-primary flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-sm"
                        >
                          <RadioGroupItem value={option} />
                          {t(`utilities.${option}`)}
                        </Label>
                      ))}
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {utilitiesIncluded === UtilitiesIncluded.estimated && (
              <FormField
                control={form.control}
                name="estimatedUtilitiesCosts"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("fields.estimatedUtilitiesCosts")}</FormLabel>
                    <FormControl>
                      <InputGroup>
                        <InputGroupAddon>
                          <InputGroupText>&euro;</InputGroupText>
                        </InputGroupAddon>
                        <InputGroupInput
                          type="number"
                          min={0}
                          placeholder={t("placeholders.estimatedUtilitiesCosts")}
                          {...field}
                          value={field.value ?? ""}
                        />
                      </InputGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
          </CardContent>
        </Card>

        {/* Property Section */}
        <Card>
          <CardContent className="space-y-6 pt-6">
            <p className="text-sm font-medium">{t("wizard.sections.property")}</p>

            <FormField
              control={form.control}
              name="roomSizeM2"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("fields.roomSize")}</FormLabel>
                  <FormControl>
                    <InputGroup>
                      <InputGroupInput
                        type="number"
                        min={1}
                        placeholder={t("placeholders.roomSize")}
                        {...field}
                        value={field.value ?? ""}
                      />
                      <InputGroupAddon align="inline-end">
                        <InputGroupText>m&sup2;</InputGroupText>
                      </InputGroupAddon>
                    </InputGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="houseType"
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
                      {HouseType.values.map((type) => (
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
                      {Furnishing.values.map((f) => (
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
              name="totalHousemates"
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
          </CardContent>
        </Card>

        {/* Availability Section */}
        <Card>
          <CardContent className="space-y-6 pt-6">
            <p className="text-sm font-medium">{t("wizard.sections.availability")}</p>

            <FormField
              control={form.control}
              name="rentalType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("fields.rentalType")}</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="flex flex-wrap gap-3"
                    >
                      {RentalType.values.map((type) => (
                        <Label
                          key={type}
                          className="border-input has-data-[state=checked]:border-primary flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-sm"
                        >
                          <RadioGroupItem value={type} />
                          {tEnums(`rental_type.${type}`)}
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

              {rentalType !== RentalType.permanent && (
                <FormField
                  control={form.control}
                  name="availableUntil"
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
          </CardContent>
        </Card>

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
