"use client";

import type { EditProfileData } from "@openhospi/validators";
import { aboutStepSchema, bioStepSchema } from "@openhospi/validators";
import { MAX_BIO_LENGTH } from "@openhospi/shared/constants";
import { Gender, StudyLevel } from "@openhospi/shared/enums";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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

import type { CardProps } from "./dialog-helpers";
import { DialogFooter, SectionCard, useSectionSubmit } from "./dialog-helpers";

export function BioCard({ profile }: CardProps) {
  const t = useTranslations("app.profile");
  const [open, setOpen] = useState(false);
  const { isPending, submit } = useSectionSubmit(profile, () => setOpen(false));

  const form = useForm({
    resolver: zodResolver(bioStepSchema),
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
                    <Textarea
                      className="min-h-32 resize-none"
                      maxLength={MAX_BIO_LENGTH}
                      {...field}
                    />
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

export function AboutCard({ profile }: CardProps) {
  const t = useTranslations("app.profile");
  const tOnboarding = useTranslations("app.onboarding");
  const tEnums = useTranslations("enums");
  const [open, setOpen] = useState(false);
  const { isPending, submit } = useSectionSubmit(profile, () => setOpen(false));

  const form = useForm({
    resolver: zodResolver(
      aboutStepSchema.pick({ gender: true, birthDate: true, studyProgram: true, studyLevel: true }),
    ),
    defaultValues: {
      gender: (profile.gender as EditProfileData["gender"]) ?? undefined,
      birthDate: profile.birthDate ?? "",
      studyProgram: profile.studyProgram ?? "",
      studyLevel: (profile.studyLevel as EditProfileData["studyLevel"]) ?? undefined,
    },
  });

  const studyLevels = StudyLevel.values;

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
