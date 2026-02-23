"use client";

import { useLocale } from "next-intl";

import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";

type LoginButtonProps = {
  label: string;
  description: string;
};

export function LoginButton({ label, description }: LoginButtonProps) {
  const locale = useLocale();

  function handleLogin() {
    authClient.signIn.sso({
      providerId: "surfconext",
      callbackURL: `/${locale}/discover`,
    });
  }

  return (
    <div className="w-full space-y-3">
      <Button onClick={handleLogin} size="lg" className="w-full">
        {label}
      </Button>
      <p className="text-muted-foreground text-xs">{description}</p>
    </div>
  );
}
