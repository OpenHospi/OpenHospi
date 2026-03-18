"use client";

import { getInstitution } from "@openhospi/inacademia";
import type { IdentityStepData } from "@openhospi/validators";
import { identityStepSchema } from "@openhospi/validators";
import { Building2, Loader2 } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
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
import { zodResolver } from "@/lib/form-utils";

import { startEmailVerification } from "../actions";

type Props = {
  defaultValues: Partial<IdentityStepData>;
  institutionDomain?: string;
  onNextAction: (email: string) => void;
};

export function IdentityStep({ defaultValues, institutionDomain, onNextAction }: Props) {
  const t = useTranslations("app.onboarding");
  const tCommon = useTranslations("common.labels");
  const locale = useLocale();
  const [isPending, startTransition] = useTransition();

  const institution = institutionDomain ? getInstitution(institutionDomain) : null;

  let resolvedInstitutionName: string | null = null;
  if (institution) {
    resolvedInstitutionName = locale === "nl" ? institution.name.nl : institution.name.en;
  }

  const form = useForm<IdentityStepData>({
    resolver: zodResolver(identityStepSchema),
    defaultValues: {
      firstName: defaultValues.firstName ?? "",
      lastName: defaultValues.lastName ?? "",
      email: defaultValues.email ?? "",
    },
  });

  function onSubmit(data: IdentityStepData) {
    startTransition(async () => {
      const result = await startEmailVerification(data);
      if (result?.error) {
        toast.error(t(`identity.${result.error}`));
        return;
      }
      toast.success(t("identity.verificationSent"));
      onNextAction(result.email);
    });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {resolvedInstitutionName && (
          <div className="flex items-center gap-3 rounded-lg border bg-muted/50 p-4">
            <Building2 className="size-5 shrink-0 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">{t("identity.institution")}</p>
              <p className="text-sm text-muted-foreground">{resolvedInstitutionName}</p>
            </div>
          </div>
        )}

        <FormField
          control={form.control}
          name="firstName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("identity.firstName")}</FormLabel>
              <FormControl>
                <Input placeholder={t("identity.firstNamePlaceholder")} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="lastName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("identity.lastName")}</FormLabel>
              <FormControl>
                <Input placeholder={t("identity.lastNamePlaceholder")} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("identity.email")}</FormLabel>
              <FormControl>
                <Input type="email" placeholder={t("identity.emailPlaceholder")} {...field} />
              </FormControl>
              <p className="text-xs text-muted-foreground">{t("identity.emailHint")}</p>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end">
          <Button type="submit" disabled={isPending}>
            {isPending && <Loader2 className="animate-spin" />}
            {tCommon("next")}
          </Button>
        </div>
      </form>
    </Form>
  );
}
