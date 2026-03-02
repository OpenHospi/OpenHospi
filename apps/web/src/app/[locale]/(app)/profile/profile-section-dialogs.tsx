"use client";

import type { EditProfileData } from "@openhospi/database/validators";
import {
  aboutStepSchema,
  languagesStepSchema,
  personalityStepSchema,
  preferencesStepSchema,
} from "@openhospi/database/validators";
import {
  MAX_BIO_LENGTH,
  MAX_LANGUAGES,
  MAX_LIFESTYLE_TAGS,
  MIN_LANGUAGES,
  MIN_LIFESTYLE_TAGS,
} from "@openhospi/shared/constants";
import {
  City,
  Gender,
  getStudyLevelsForInstitutionType,
  Language,
  LifestyleTag,
  StudyLevel,
  Vereniging,
} from "@openhospi/shared/enums";
import { getInstitution } from "@openhospi/surfconext";
import { Loader2, Pencil } from "lucide-react";
import { useTranslations } from "next-intl";
import type { ReactNode } from "react";
import { useState, useTransition } from "react";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";

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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { zodResolver } from "@/lib/form-utils";
import type { ProfileWithPhotos } from "@/lib/profile";
import { cn } from "@/lib/utils";

import { updateProfile } from "./profile-actions";

type SectionCardProps = {
  title: string;
  onEdit: () => void;
  children: ReactNode;
  className?: string;
};

function SectionCard({ title, onEdit, children, className }: SectionCardProps) {
  const tCommon = useTranslations("common.labels");
  return (
    <div className={cn("rounded-xl border bg-card p-5 text-card-foreground shadow-sm", className)}>
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-base font-semibold">{title}</h3>
        <Button variant="ghost" size="icon" className="size-8" onClick={onEdit}>
          <Pencil className="size-3.5" />
          <span className="sr-only">{tCommon("edit")}</span>
        </Button>
      </div>
      {children}
    </div>
  );
}

function profileToFormDefaults(profile: ProfileWithPhotos): EditProfileData {
  return {
    gender: (profile.gender as EditProfileData["gender"]) ?? undefined,
    birthDate: profile.birthDate ?? "",
    studyProgram: profile.studyProgram ?? "",
    studyLevel: (profile.studyLevel as EditProfileData["studyLevel"]) ?? undefined,
    bio: profile.bio ?? "",
    lifestyleTags: (profile.lifestyleTags as LifestyleTag[]) ?? [],
    languages: (profile.languages as Language[]) ?? [],
    preferredCity: (profile.preferredCity as EditProfileData["preferredCity"]) ?? undefined,
    maxRent: profile.maxRent ? Number(profile.maxRent) : undefined,
    availableFrom: profile.availableFrom ?? "",
    vereniging: (profile.vereniging as EditProfileData["vereniging"]) ?? undefined,
  };
}

function useSectionSubmit(
  profile: ProfileWithPhotos,
  onSuccess: () => void,
) {
  const t = useTranslations("app.profile");
  const [isPending, startTransition] = useTransition();

  function submit(data: Partial<EditProfileData>) {
    startTransition(async () => {
      const full = { ...profileToFormDefaults(profile), ...data };
      const result = await updateProfile(full);
      if (result?.error) {
        toast.error(result.error);
        return;
      }
      toast.success(t("editSuccess"));
      onSuccess();
    });
  }

  return { isPending, submit };
}

type DialogFooterProps = {
  isPending: boolean;
  onCancel: () => void;
};

function DialogFooter({ isPending, onCancel }: DialogFooterProps) {
  const tCommon = useTranslations("common.labels");
  return (
    <div className="flex justify-end gap-2 pt-2">
      <Button type="button" variant="outline" onClick={onCancel}>
        {tCommon("cancel")}
      </Button>
      <Button type="submit" disabled={isPending}>
        {isPending && <Loader2 className="animate-spin" />}
        {tCommon("save")}
      </Button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Bio Card
// ---------------------------------------------------------------------------

type CardProps = {
  profile: ProfileWithPhotos;
};

export function BioCard({ profile }: CardProps) {
  const t = useTranslations("app.profile");
  const [open, setOpen] = useState(false);
  const { isPending, submit } = useSectionSubmit(profile, () => setOpen(false));

  const form = useForm({
    resolver: zodResolver(aboutStepSchema.pick({ bio: true })),
    defaultValues: { bio: profile.bio ?? "" },
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <SectionCard title={t("bio")} onEdit={() => setOpen(true)} className="md:col-span-2">
        {profile.bio ? (
          <p className="whitespace-pre-wrap text-sm text-muted-foreground">{profile.bio}</p>
        ) : (
          <p className="text-sm italic text-muted-foreground">—</p>
        )}
      </SectionCard>

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("editBio")}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(submit)} className="space-y-4">
            <FormField
              control={form.control}
              name="bio"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Textarea className="min-h-32 resize-none" maxLength={MAX_BIO_LENGTH} {...field} />
                  </FormControl>
                  <p className="text-xs text-muted-foreground">
                    {(field.value ?? "").length}/{MAX_BIO_LENGTH}
                  </p>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter isPending={isPending} onCancel={() => setOpen(false)} />
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// About Card
// ---------------------------------------------------------------------------

export function AboutCard({ profile }: CardProps) {
  const t = useTranslations("app.profile");
  const tOnboarding = useTranslations("app.onboarding");
  const tEnums = useTranslations("enums");
  const [open, setOpen] = useState(false);
  const { isPending, submit } = useSectionSubmit(profile, () => setOpen(false));

  const form = useForm({
    resolver: zodResolver(aboutStepSchema.omit({ bio: true })),
    defaultValues: {
      gender: (profile.gender as EditProfileData["gender"]) ?? undefined,
      birthDate: profile.birthDate ?? "",
      studyProgram: profile.studyProgram ?? "",
      studyLevel: (profile.studyLevel as EditProfileData["studyLevel"]) ?? undefined,
    },
  });

  const studyLevels = profile.institutionDomain
    ? getStudyLevelsForInstitutionType(getInstitution(profile.institutionDomain).type)
    : StudyLevel.values;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <SectionCard title={t("studyInfo")} onEdit={() => setOpen(true)}>
        <dl className="space-y-2 text-sm">
          {profile.studyProgram && (
            <div>
              <dt className="text-muted-foreground">{t("studyProgram")}</dt>
              <dd>{profile.studyProgram}</dd>
            </div>
          )}
          {profile.studyLevel && (
            <div>
              <dt className="text-muted-foreground">{t("studyLevel")}</dt>
              <dd>{tEnums(`study_level.${profile.studyLevel}`)}</dd>
            </div>
          )}
          {profile.gender && (
            <div>
              <dt className="text-muted-foreground">{t("gender")}</dt>
              <dd>{tEnums(`gender.${profile.gender}`)}</dd>
            </div>
          )}
          {profile.birthDate && (
            <div>
              <dt className="text-muted-foreground">{t("birthDate")}</dt>
              <dd>{profile.birthDate}</dd>
            </div>
          )}
        </dl>
      </SectionCard>

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("editAbout")}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(submit)} className="space-y-4">
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
                      {studyLevels.map((level) => (
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

            <DialogFooter isPending={isPending} onCancel={() => setOpen(false)} />
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// Preferences Card
// ---------------------------------------------------------------------------

export function PreferencesCard({ profile }: CardProps) {
  const t = useTranslations("app.profile");
  const tCommon = useTranslations("common.labels");
  const tOnboarding = useTranslations("app.onboarding");
  const tEnums = useTranslations("enums");
  const [open, setOpen] = useState(false);
  const { isPending, submit } = useSectionSubmit(profile, () => setOpen(false));

  const form = useForm({
    resolver: zodResolver(preferencesStepSchema),
    defaultValues: {
      preferredCity: (profile.preferredCity as EditProfileData["preferredCity"]) ?? undefined,
      maxRent: profile.maxRent ? Number(profile.maxRent) : undefined,
      availableFrom: profile.availableFrom ?? "",
      vereniging: (profile.vereniging as EditProfileData["vereniging"]) ?? undefined,
    },
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <SectionCard title={t("preferences")} onEdit={() => setOpen(true)}>
        <dl className="space-y-2 text-sm">
          {profile.preferredCity && (
            <div>
              <dt className="text-muted-foreground">{t("preferredCity")}</dt>
              <dd>{tEnums(`city.${profile.preferredCity}`)}</dd>
            </div>
          )}
          {profile.maxRent && (
            <div>
              <dt className="text-muted-foreground">{t("maxRent")}</dt>
              <dd>&euro;{profile.maxRent}{tCommon("perMonth")}</dd>
            </div>
          )}
          {profile.availableFrom && (
            <div>
              <dt className="text-muted-foreground">{t("availableFrom")}</dt>
              <dd>{profile.availableFrom}</dd>
            </div>
          )}
          {profile.vereniging && (
            <div>
              <dt className="text-muted-foreground">{tOnboarding("fields.vereniging")}</dt>
              <dd>{tEnums(`vereniging.${profile.vereniging}`)}</dd>
            </div>
          )}
        </dl>
      </SectionCard>

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("editPreferences")}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(submit)} className="space-y-4">
            <FormField
              control={form.control}
              name="preferredCity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{tOnboarding("fields.preferredCity")}</FormLabel>
                  <Combobox
                    value={field.value ?? null}
                    onValueChange={field.onChange}
                    items={City.values}
                    itemToStringLabel={(city: City) => tEnums(`city.${city}`)}
                  >
                    <ComboboxInput placeholder={tOnboarding("placeholders.preferredCity")} />
                    <ComboboxContent>
                      <ComboboxEmpty>{tCommon("noResults")}</ComboboxEmpty>
                      <ComboboxList>
                        {(city: City) => (
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
                <FormItem>
                  <FormLabel>{tOnboarding("fields.vereniging")}</FormLabel>
                  <Combobox
                    value={field.value ?? null}
                    onValueChange={(val) =>
                      form.setValue("vereniging", val ?? undefined, { shouldValidate: true })
                    }
                    items={Vereniging.values}
                    itemToStringLabel={(v: Vereniging) => tEnums(`vereniging.${v}`)}
                  >
                    <ComboboxInput
                      placeholder={tOnboarding("placeholders.searchVereniging")}
                      showClear
                    />
                    <ComboboxContent>
                      <ComboboxEmpty>{tCommon("noResults")}</ComboboxEmpty>
                      <ComboboxList>
                        {(v: Vereniging) => (
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

            <DialogFooter isPending={isPending} onCancel={() => setOpen(false)} />
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// Languages Card
// ---------------------------------------------------------------------------

export function LanguagesCard({ profile }: CardProps) {
  const t = useTranslations("app.profile");
  const tOnboarding = useTranslations("app.onboarding");
  const tEnums = useTranslations("enums");
  const [open, setOpen] = useState(false);
  const { isPending, submit } = useSectionSubmit(profile, () => setOpen(false));

  const form = useForm({
    resolver: zodResolver(languagesStepSchema),
    defaultValues: {
      languages: (profile.languages as Language[]) ?? [],
    },
  });

  const selectedLanguages = useWatch({ control: form.control, name: "languages" }) ?? [];

  function toggleLanguage(lang: Language) {
    const current = form.getValues("languages") ?? [];
    if (current.includes(lang)) {
      form.setValue("languages", current.filter((l) => l !== lang), { shouldValidate: true });
    } else if (current.length < MAX_LANGUAGES) {
      form.setValue("languages", [...current, lang], { shouldValidate: true });
    }
  }

  const languages = (profile.languages as Language[]) ?? [];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <SectionCard title={t("languages")} onEdit={() => setOpen(true)}>
        {languages.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {languages.map((lang) => (
              <Badge key={lang} variant="secondary">
                {tEnums(`language_enum.${lang}`)}
              </Badge>
            ))}
          </div>
        ) : (
          <p className="text-sm italic text-muted-foreground">—</p>
        )}
      </SectionCard>

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("editLanguages")}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(submit)} className="space-y-4">
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">
                {tOnboarding("languageCounter", {
                  count: String(selectedLanguages.length),
                  min: String(MIN_LANGUAGES),
                  max: String(MAX_LANGUAGES),
                })}
              </p>
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
                      onClick={() => toggleLanguage(lang)}
                    >
                      {tEnums(`language_enum.${lang}`)}
                    </Badge>
                  );
                })}
              </div>
            </div>
            <DialogFooter isPending={isPending} onCancel={() => setOpen(false)} />
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// Lifestyle Card
// ---------------------------------------------------------------------------

export function LifestyleCard({ profile }: CardProps) {
  const t = useTranslations("app.profile");
  const tOnboarding = useTranslations("app.onboarding");
  const tEnums = useTranslations("enums");
  const [open, setOpen] = useState(false);
  const { isPending, submit } = useSectionSubmit(profile, () => setOpen(false));

  const form = useForm({
    resolver: zodResolver(personalityStepSchema),
    defaultValues: {
      lifestyleTags: (profile.lifestyleTags as LifestyleTag[]) ?? [],
    },
  });

  const selectedTags = useWatch({ control: form.control, name: "lifestyleTags" }) ?? [];

  function toggleTag(tag: LifestyleTag) {
    const current = form.getValues("lifestyleTags") ?? [];
    if (current.includes(tag)) {
      form.setValue("lifestyleTags", current.filter((t) => t !== tag), { shouldValidate: true });
    } else if (current.length < MAX_LIFESTYLE_TAGS) {
      form.setValue("lifestyleTags", [...current, tag], { shouldValidate: true });
    }
  }

  const tags = (profile.lifestyleTags as LifestyleTag[]) ?? [];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <SectionCard title={t("lifestyleTags")} onEdit={() => setOpen(true)}>
        {tags.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => (
              <Badge key={tag} variant="secondary">
                {tEnums(`lifestyle_tag.${tag}`)}
              </Badge>
            ))}
          </div>
        ) : (
          <p className="text-sm italic text-muted-foreground">—</p>
        )}
      </SectionCard>

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("editLifestyle")}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(submit)} className="space-y-4">
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">
                {tOnboarding("tagCounter", {
                  count: String(selectedTags.length),
                  min: String(MIN_LIFESTYLE_TAGS),
                  max: String(MAX_LIFESTYLE_TAGS),
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
            <DialogFooter isPending={isPending} onCancel={() => setOpen(false)} />
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
