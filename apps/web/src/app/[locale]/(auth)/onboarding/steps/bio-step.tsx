"use client";

import type { BioStepData } from "@openhospi/validators";
import { bioStepSchema } from "@openhospi/validators";
import { MAX_BIO_LENGTH } from "@openhospi/shared/constants";
import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useTransition } from "react";
import { useForm, useWatch } from "react-hook-form";
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
import { Textarea } from "@/components/ui/textarea";
import { zodResolver } from "@/lib/form-utils";

import { saveBioStep } from "../actions";

type Props = {
  defaultValue: string;
  onBack: () => void;
  onNext: () => void;
};

export function BioStep({ defaultValue, onBack, onNext }: Props) {
  const t = useTranslations("app.onboarding");
  const tCommon = useTranslations("common.labels");
  const [isPending, startTransition] = useTransition();

  const form = useForm<BioStepData>({
    resolver: zodResolver(bioStepSchema),
    defaultValues: { bio: defaultValue },
  });

  const bioLength = useWatch({ control: form.control, name: "bio" })?.length ?? 0;

  function onSubmit(data: BioStepData) {
    startTransition(async () => {
      const result = await saveBioStep(data);
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
          name="bio"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("fields.bio")}</FormLabel>
              <FormControl>
                <Textarea
                  placeholder={t("placeholders.bio")}
                  className="min-h-32 resize-none"
                  maxLength={MAX_BIO_LENGTH}
                  {...field}
                />
              </FormControl>
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <FormMessage />
                <span className="ml-auto">
                  {bioLength}/{MAX_BIO_LENGTH}
                </span>
              </div>
            </FormItem>
          )}
        />

        <div className="flex justify-between">
          <Button variant="outline" type="button" onClick={onBack}>
            {tCommon("back")}
          </Button>
          <div className="flex gap-2">
            <Button variant="ghost" type="button" onClick={onNext}>
              {tCommon("skip")}
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="animate-spin" />}
              {tCommon("next")}
            </Button>
          </div>
        </div>
      </form>
    </Form>
  );
}
