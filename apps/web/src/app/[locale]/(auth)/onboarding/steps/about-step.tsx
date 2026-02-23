"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { MAX_BIO_LENGTH } from "@openhospi/shared/constants";
import { GENDERS, getStudyLevelsForInstitutionType, STUDY_LEVELS } from "@openhospi/shared/enums";
import { getInstitution } from "@openhospi/surfconext";
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
import { Textarea } from "@/components/ui/textarea";
import type { AboutStepData } from "@/lib/schemas/profile";
import { aboutStepSchema } from "@/lib/schemas/profile";

import { saveAboutStep } from "../actions";

type Props = {
  defaultValues: Partial<AboutStepData>;
  institutionDomain?: string;
  onNext: () => void;
};

export function AboutStep({ defaultValues, institutionDomain, onNext }: Props) {
  const t = useTranslations("app.onboarding");
  const tEnums = useTranslations("enums");
  const [isPending, startTransition] = useTransition();

  const form = useForm<AboutStepData>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(aboutStepSchema as any),
    defaultValues: {
      gender: defaultValues.gender,
      birth_date: defaultValues.birth_date ?? "",
      study_program: defaultValues.study_program ?? "",
      study_level: defaultValues.study_level,
      bio: defaultValues.bio ?? "",
    },
  });

  function onSubmit(data: AboutStepData) {
    startTransition(async () => {
      const result = await saveAboutStep(data);
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
          name="gender"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("fields.gender")}</FormLabel>
              <FormControl>
                <RadioGroup
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  className="flex flex-wrap gap-3"
                >
                  {GENDERS.map((g) => (
                    <label
                      key={g}
                      className="border-input has-data-[state=checked]:border-primary flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-sm"
                    >
                      <RadioGroupItem value={g} />
                      {tEnums(`gender.${g}`)}
                    </label>
                  ))}
                </RadioGroup>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="birth_date"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("fields.birthDate")}</FormLabel>
              <FormControl>
                <Input type="date" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="study_program"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("fields.studyProgram")}</FormLabel>
              <FormControl>
                <Input placeholder={t("placeholders.studyProgram")} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="study_level"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                {t("fields.studyLevel")}{" "}
                <span className="text-muted-foreground font-normal">({t("optional")})</span>
              </FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder={t("placeholders.studyLevel")} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {(institutionDomain
                    ? getStudyLevelsForInstitutionType(getInstitution(institutionDomain).type)
                    : STUDY_LEVELS
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
              <FormLabel>
                {t("fields.bio")}{" "}
                <span className="text-muted-foreground font-normal">({t("optional")})</span>
              </FormLabel>
              <FormControl>
                <Textarea
                  placeholder={t("placeholders.bio")}
                  className="min-h-24 resize-none"
                  maxLength={MAX_BIO_LENGTH}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end">
          <Button type="submit" disabled={isPending}>
            {isPending && <Loader2 className="animate-spin" />}
            {t("next")}
          </Button>
        </div>
      </form>
    </Form>
  );
}
