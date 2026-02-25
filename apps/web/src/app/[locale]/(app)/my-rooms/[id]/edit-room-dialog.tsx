"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  CITIES,
  FURNISHINGS,
  GENDER_PREFERENCES,
  HOUSE_TYPES,
  LIFESTYLE_TAGS,
  LOCATION_TAGS,
  RENTAL_TYPES,
  ROOM_FEATURES,
  VERENIGINGEN,
} from "@openhospi/shared/enums";
import type { LifestyleTag, LocationTag, RoomFeature } from "@openhospi/shared/enums";
import { Check, ChevronsUpDown, Loader2, Pencil } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import type { Room } from "@/lib/rooms";
import type { EditRoomData } from "@/lib/schemas/room";
import { editRoomSchema } from "@/lib/schemas/room";
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
      address: room.address ?? "",
      rent_price: room.rent_price,
      deposit: room.deposit ?? undefined,
      utilities_included: room.utilities_included,
      room_size_m2: room.room_size_m2 ?? undefined,
      available_from: room.available_from ?? "",
      available_until: room.available_until ?? "",
      rental_type: room.rental_type as EditRoomData["rental_type"],
      house_type: (room.house_type as EditRoomData["house_type"]) ?? undefined,
      furnishing: (room.furnishing as EditRoomData["furnishing"]) ?? undefined,
      total_housemates: room.total_housemates ?? undefined,
      features: room.features as RoomFeature[],
      location_tags: room.location_tags as LocationTag[],
      preferred_gender: room.preferred_gender as EditRoomData["preferred_gender"],
      preferred_age_min: room.preferred_age_min ?? undefined,
      preferred_age_max: room.preferred_age_max ?? undefined,
      preferred_lifestyle_tags: room.preferred_lifestyle_tags as LifestyleTag[],
      room_vereniging: (room.room_vereniging as EditRoomData["room_vereniging"]) ?? undefined,
    },
  });

  const rentalType = form.watch("rental_type");
  const selectedFeatures = form.watch("features") ?? [];
  const selectedLocationTags = form.watch("location_tags") ?? [];
  const selectedLifestyleTags = form.watch("preferred_lifestyle_tags") ?? [];

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

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
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
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
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

            <div className="grid gap-4 sm:grid-cols-2">
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
              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("fields.address")}</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="rent_price"
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
                    <Input type="number" min={1} {...field} value={field.value ?? ""} />
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
                    <Input type="number" min={1} {...field} value={field.value ?? ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

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
              name="room_vereniging"
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
                                form.setValue("room_vereniging", undefined, {
                                  shouldValidate: true,
                                });
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
                                  form.setValue("room_vereniging", v, { shouldValidate: true });
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
