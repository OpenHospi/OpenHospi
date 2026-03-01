"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import type { EditRoomData } from "@openhospi/database/validators";
import { editRoomSchema } from "@openhospi/database/validators";
import {
  City,
  Furnishing,
  GenderPreference,
  HouseType,
  Language,
  LifestyleTag,
  LocationTag,
  RentalType,
  RoomFeature,
  UtilitiesIncluded,
  Vereniging,
} from "@openhospi/shared/enums";
import { Loader2, Pencil } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { AddressAutocomplete } from "@/components/app/address-autocomplete";
import { Badge } from "@/components/ui/badge";
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { Room } from "@/lib/rooms";
import { cn } from "@/lib/utils";

import { updateRoom } from "./actions";

type Props = {
  room: Room;
};

export function EditRoomDialog({ room }: Props) {
  const t = useTranslations("app.rooms");
  const tEnums = useTranslations("enums");
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const form = useForm<EditRoomData>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(editRoomSchema as any),
    defaultValues: {
      title: room.title,
      description: room.description ?? "",
      city: room.city as EditRoomData["city"],
      neighborhood: room.neighborhood ?? "",
      streetName: room.streetName ?? "",
      houseNumber: room.houseNumber ?? "",
      postalCode: room.postalCode ?? "",
      latitude: room.latitude ?? undefined,
      longitude: room.longitude ?? undefined,
      rentPrice: Number(room.rentPrice),
      deposit: room.deposit ? Number(room.deposit) : undefined,
      utilitiesIncluded: (room.utilitiesIncluded as EditRoomData["utilitiesIncluded"]) ?? UtilitiesIncluded.included,
      serviceCosts: room.serviceCosts ? Number(room.serviceCosts) : undefined,
      estimatedUtilitiesCosts: room.estimatedUtilitiesCosts ? Number(room.estimatedUtilitiesCosts) : undefined,
      roomSizeM2: room.roomSizeM2 ?? undefined,
      availableFrom: room.availableFrom ?? "",
      availableUntil: room.availableUntil ?? "",
      rentalType: room.rentalType as EditRoomData["rentalType"],
      houseType: (room.houseType as EditRoomData["houseType"]) ?? undefined,
      furnishing: (room.furnishing as EditRoomData["furnishing"]) ?? undefined,
      totalHousemates: room.totalHousemates ?? undefined,
      features: (room.features as RoomFeature[]) ?? [],
      locationTags: (room.locationTags as LocationTag[]) ?? [],
      preferredGender: room.preferredGender as EditRoomData["preferredGender"],
      preferredAgeMin: room.preferredAgeMin ?? undefined,
      preferredAgeMax: room.preferredAgeMax ?? undefined,
      preferredLifestyleTags: (room.preferredLifestyleTags as LifestyleTag[]) ?? [],
      acceptedLanguages: (room.acceptedLanguages as Language[]) ?? [],
      roomVereniging: (room.roomVereniging as EditRoomData["roomVereniging"]) ?? undefined,
    },
  });

  const rentalType = form.watch("rentalType");
  const utilitiesIncluded = form.watch("utilitiesIncluded");
  const selectedFeatures = form.watch("features") ?? [];
  const selectedLocationTags = form.watch("locationTags") ?? [];
  const selectedLifestyleTags = form.watch("preferredLifestyleTags") ?? [];
  const selectedLanguages = form.watch("acceptedLanguages") ?? [];

  function toggleArrayField<T extends string>(
    name: "features" | "locationTags" | "preferredLifestyleTags" | "acceptedLanguages",
    value: T,
  ) {
    const current = (form.getValues(name) as T[]) ?? [];
    if (current.includes(value)) {
      form.setValue(name, current.filter((v) => v !== value) as never, { shouldValidate: true });
    } else {
      form.setValue(name, [...current, value] as never, { shouldValidate: true });
    }
  }

  function onSubmit(data: EditRoomData) {
    startTransition(async () => {
      const result = await updateRoom(room.id, data);
      if (result?.error) {
        toast.error(result.error);
        return;
      }
      toast.success(t("status.updated"));
      setOpen(false);
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Pencil className="size-4" />
          {t("actions.edit")}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t("actions.edit")}</DialogTitle>
        </DialogHeader>

        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
        <Form {...(form as any)}>
          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
          <form onSubmit={form.handleSubmit(onSubmit as any)} className="space-y-5">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("fields.title")}</FormLabel>
                  <FormControl>
                    <Input {...field} />
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
                    <Textarea className="min-h-24 resize-none" {...field} />
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
                  <Combobox
                    value={field.value ?? null}
                    onValueChange={field.onChange}
                    items={City.values}
                    itemToStringLabel={(city) => tEnums(`city.${city}`)}
                  >
                    <ComboboxInput placeholder={t("fields.city")} />
                    <ComboboxContent>
                      <ComboboxEmpty>{t("noResults")}</ComboboxEmpty>
                      <ComboboxList>
                        {(city) => (
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
              name="neighborhood"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("fields.neighborhood")}</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-2">
              <FormLabel>{t("fields.address")}</FormLabel>
              <AddressAutocomplete
                defaultDisplayValue={
                  room.streetName
                    ? [room.streetName, room.houseNumber].filter(Boolean).join(" ") +
                      (room.postalCode ? `, ${room.postalCode}` : "")
                    : ""
                }
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

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="rentPrice"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("fields.rentPrice")}</FormLabel>
                    <FormControl>
                      <Input type="number" min={0} {...field} value={field.value ?? ""} />
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
                      <Input type="number" min={0} {...field} value={field.value ?? ""} />
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
                    <Input
                      type="number"
                      min={0}
                      placeholder={t("placeholders.serviceCosts")}
                      {...field}
                      value={field.value ?? ""}
                    />
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
                      <Input
                        type="number"
                        min={0}
                        placeholder={t("placeholders.estimatedUtilitiesCosts")}
                        {...field}
                        value={field.value ?? ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="roomSizeM2"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("fields.roomSize")}</FormLabel>
                  <FormControl>
                    <Input type="number" min={1} {...field} value={field.value ?? ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

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
                    <Input type="number" min={1} {...field} value={field.value ?? ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

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
              <FormLabel>{t("fields.preferredLifestyleTags")}</FormLabel>
              <div className="flex flex-wrap gap-2">
                {LifestyleTag.values.map((tag) => {
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

            <FormField
              control={form.control}
              name="roomVereniging"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {t("fields.roomVereniging")}{" "}
                    <span className="text-muted-foreground font-normal">({t("optional")})</span>
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
                      <ComboboxEmpty>{t("noResults")}</ComboboxEmpty>
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

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                {t("actions.back")}
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending && <Loader2 className="animate-spin" />}
                {t("actions.edit")}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
