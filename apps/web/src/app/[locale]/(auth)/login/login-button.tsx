"use client";

import { GraduationCap, Loader2 } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth/client";

export function LoginButton() {
  const t = useTranslations("auth.login");
  const locale = useLocale();
  const [isPending, startTransition] = useTransition();

  function handleLogin() {
    startTransition(async () => {
      const result = await authClient.signIn.oauth2({
        providerId: "inacademia",
        callbackURL: `/${locale}/discover`,
      });
      if (result.error) {
        toast.error(t("error"));
      }
    });
  }

  return (
    <div className="w-full space-y-4">
      <Button onClick={handleLogin} disabled={isPending} size="lg" className="w-full">
        {isPending ? <Loader2 className="animate-spin" /> : <GraduationCap />}
        {t("inacademiaButton")}
      </Button>
    </div>
  );
}
