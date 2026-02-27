"use client";

import { GraduationCap, Loader2 } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";

export function LoginButton() {
  const t = useTranslations("auth.login");
  const locale = useLocale();
  const [isPending, startTransition] = useTransition();

  function handleLogin() {
    startTransition(async () => {
      const result = await authClient.signIn.sso({
        providerId: "surfconext",
        callbackURL: `/${locale}/discover`,
      });
      if (result.error) {
        toast.error(t("error"));
      }
    });
  }

  return (
    <Button onClick={handleLogin} disabled={isPending} size="lg" className="w-full">
      {isPending ? <Loader2 className="animate-spin" /> : <GraduationCap />}
      {t("surfconextButton")}
    </Button>
  );
}
