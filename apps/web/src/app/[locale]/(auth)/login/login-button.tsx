"use client";

import { SiGithub } from "@icons-pack/react-simple-icons";
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

  function handleGitHubLogin() {
    startTransition(async () => {
      const result = await authClient.signIn.social({
        provider: "github",
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
        {t("surfconextButton")}
      </Button>

      {process.env.NODE_ENV === "development" && (
        <>
          <div className="flex items-center gap-3">
            <div className="h-px flex-1 bg-border" />
            <span className="text-xs text-muted-foreground">{t("devOrDivider")}</span>
            <div className="h-px flex-1 bg-border" />
          </div>

          <Button
            variant="outline"
            onClick={handleGitHubLogin}
            disabled={isPending}
            size="lg"
            className="w-full"
          >
            {isPending ? <Loader2 className="animate-spin" /> : <SiGithub color="currentColor" />}
            {t("devGithubButton")}
          </Button>
          <p className="text-center text-xs text-muted-foreground">{t("devGithubDescription")}</p>
        </>
      )}
    </div>
  );
}
