"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import type { EditProfileData } from "@openhospi/database/validators";
import { editProfileSchema } from "@openhospi/database/validators";
import {
  MAX_BIO_LENGTH,
  MAX_LIFESTYLE_TAGS,
  MIN_LIFESTYLE_TAGS,
} from "@openhospi/shared/constants";
import {
  City,
  Gender,
  getStudyLevelsForInstitutionType,
  LifestyleTag,
  StudyLevel,
  Vereniging,
} from "@openhospi/shared/enums";
import { getInstitution } from "@openhospi/surfconext";
import { Check, ChevronsUpDown, Loader2, Pencil } from "lucide-react";
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
import { Label } from "@/components/ui/label";
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
import type { Profile } from "@/lib/profile";
import { cn } from "@/lib/utils";

import { updateProfile } from "./profile-actions";

type Props = {
  profile: Profile;
};

export function EditProfileDialog({ profile }: Props) {
  const t = useTranslations("app.profile");
  const tOnboarding = useTranslations("app.onboarding");
  const tEnums = useTranslations("enums");
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const form = useForm<EditProfileData>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(editProfileSchema as any),
    defaultValues: {
      gender: (profile.gender as EditProfileData["gender"]) ?? undefined,
      birthDate: profile.birthDate ?? "",
      studyProgram: profile.studyProgram ?? "",
      studyLevel: (profile.studyLevel as EditProfileData["studyLevel"]) ?? undefined,
      bio: profile.bio ?? "",
      lifestyleTags: (profile.lifestyleTags as LifestyleTag[]) ?? [],
      preferredCity: (profile.preferredCity as EditProfileData["preferredCity"]) ?? undefined,
      maxRent: profile.maxRent ? Number(profile.maxRent) : undefined,
      availableFrom: profile.availableFrom ?? "",
      vereniging: (profile.vereniging as EditProfileData["vereniging"]) ?? undefined,
      instagramHandle: profile.instagramHandle ?? "",
      showInstagram: profile.showInstagram ?? false,
    },
  });

  function onSubmit(data: EditProfileData) {
    startTransition(async () => {
      const result = await updateProfile(data);
      if (result?.error) {
        toast.error(result.error);
        return;
      }
      toast.success(t("editSuccess"));
      setOpen(false);
    });
  }

  const selectedTags = form.watch("lifestyleTags") ?? [];

  function toggleTag(tag: LifestyleTag) {
    const current = form.getValues("lifestyleTags") ?? [];
    if (current.includes(tag)) {
      form.setValue(
        "lifestyleTags",
        current.filter((t) => t !== tag),
        { shouldValidate: true },
      );
    } else if (current.length < MAX_LIFESTYLE_TAGS) {
      form.setValue("lifestyleTags", [...current, tag], { shouldValidate: true });
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Pencil className="size-4" />
          {t("edit")}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t("editTitle")}</DialogTitle>
        </DialogHeader>

        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
        <Form {...(form as any)}>
          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
          <form onSubmit={form.handleSubmit(onSubmit as any)} className="space-y-5">
            <FormField
              control={form.control}
              name="gender"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{tOnboarding("fields.gender")}</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="flex flex-wrap gap-3"
                    >
                      {Gender.values.map((g) => (
                        <Label
                          key={g}
                          className="border-input has-data-[state=checked]:border-primary flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-sm"
                        >
                          <RadioGroupItem value={g} />
                          {tEnums(`gender.${g}`)}
                        </Label>
                      ))}
                    </RadioGroup>
                  </FormControl>
                  {field.value === Gender.prefer_not_to_say && (
                    <p className="text-xs text-muted-foreground">
                      {tOnboarding("genderPreferNotToSayHint")}
                    </p>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="birthDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{tOnboarding("fields.birthDate")}</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="studyProgram"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{tOnboarding("fields.studyProgram")}</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="studyLevel"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{tOnboarding("fields.studyLevel")}</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {(profile.institutionDomain
                        ? getStudyLevelsForInstitutionType(
                            getInstitution(profile.institutionDomain).type,
                          )
                        : StudyLevel.values
                      ).map((level) => (
                        <SelectItem key={level} value={level}>
                          {tEnums(`study_level.${level}`)}
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
              name="bio"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{tOnboarding("fields.bio")}</FormLabel>
                  <FormControl>
                    <Textarea
                      className="min-h-24 resize-none"
                      maxLength={MAX_BIO_LENGTH}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-2">
              <FormLabel>{t("lifestyleTags")}</FormLabel>
              <p className="text-xs text-muted-foreground">
                {tOnboarding("tagCounter", {
                  count: selectedTags.length,
                  min: MIN_LIFESTYLE_TAGS,
                  max: MAX_LIFESTYLE_TAGS,
                })}
              </p>
              <div className="flex flex-wrap gap-2">
                {LifestyleTag.values.map((tag) => {
                  const isSelected = selectedTags.includes(tag);
                  return (
                    <Badge
                      key={tag}
                      variant={isSelected ? "default" : "outline"}
                      className={cn(
                        "cursor-pointer select-none px-2.5 py-1 text-xs transition-colors",
                        isSelected && "bg-primary text-primary-foreground",
                      )}
                      onClick={() => toggleTag(tag)}
                    >
                      {tEnums(`lifestyle_tag.${tag}`)}
                    </Badge>
                  );
                })}
              </div>
            </div>

            <FormField
              control={form.control}
              name="preferredCity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{tOnboarding("fields.preferredCity")}</FormLabel>
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
              name="maxRent"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{tOnboarding("fields.maxRent")}</FormLabel>
                  <FormControl>
                    <Input type="number" min={0} max={5000} {...field} value={field.value ?? ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="availableFrom"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{tOnboarding("fields.availableFrom")}</FormLabel>
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
                <FormItem className="flex flex-col">
                  <FormLabel>{tOnboarding("fields.vereniging")}</FormLabel>
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
                            : tOnboarding("placeholders.searchVereniging")}
                          <ChevronsUpDown className="ml-2 size-4 shrink-0 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                      <Command>
                        <CommandInput placeholder={tOnboarding("placeholders.searchVereniging")} />
                        <CommandList>
                          <CommandEmpty>{tOnboarding("noResults")}</CommandEmpty>
                          <CommandGroup>
                            <CommandItem
                              value="__none__"
                              onSelect={() => {
                                form.setValue("vereniging", undefined, { shouldValidate: true });
                              }}
                            >
                              <Check
                                className={cn(
                                  "mr-2 size-4",
                                  !field.value ? "opacity-100" : "opacity-0",
                                )}
                              />
                              {tOnboarding("noSelection")}
                            </CommandItem>
                            {Vereniging.values.map((v) => (
                              <CommandItem
                                key={v}
                                value={tEnums(`vereniging.${v}`)}
                                onSelect={() => {
                                  form.setValue("vereniging", v, { shouldValidate: true });
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

            <FormField
              control={form.control}
              name="instagramHandle"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{tOnboarding("fields.instagram")}</FormLabel>
                  <FormControl>
                    <Input placeholder="@username" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="showInstagram"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-lg border p-3">
                  <FormLabel className="cursor-pointer">
                    {tOnboarding("fields.showInstagram")}
                  </FormLabel>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                {t("cancel")}
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending && <Loader2 className="animate-spin" />}
                {t("save")}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
