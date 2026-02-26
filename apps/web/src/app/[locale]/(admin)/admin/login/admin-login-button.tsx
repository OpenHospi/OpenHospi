"use client";

import { Github, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";

export function AdminLoginButton() {
  const t = useTranslations("admin.login");
  const [isPending, startTransition] = useTransition();

  function handleLogin() {
    startTransition(async () => {
      const result = await authClient.signIn.social({
        provider: "github",
        callbackURL: "/admin",
      });
      if (result.error) {
        toast.error(t("error"));
      }
    });
  }

  return (
    <Button onClick={handleLogin} disabled={isPending} className="w-full" size="lg">
      {isPending ? <Loader2 className="animate-spin" /> : <Github />}
      {t("githubButton")}
    </Button>
  );
}
