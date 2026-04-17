"use client";

import { SiGoogle } from "@icons-pack/react-simple-icons";
import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth/client";

export function LoginButton() {
  const t = useTranslations("admin.login");
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    setLoading(true);
    const result = await authClient.signIn.sso({
      providerId: "google-workspace",
      callbackURL: "/",
      errorCallbackURL: "/login?error=saml_failed",
    });
    if (result?.error) {
      setLoading(false);
      toast.error(t("errors.samlFailed"));
    }
  }

  return (
    <Button onClick={handleLogin} disabled={loading} className="w-full" size="lg">
      {loading ? <Loader2 className="animate-spin" /> : <SiGoogle />}
      {t("googleButton")}
    </Button>
  );
}
