"use client";

import { Loader2, ShieldCheck } from "lucide-react";
import { useTranslations } from "next-intl";
import { useTransition } from "react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

import { finishOnboarding } from "../actions";

type Props = {
  userId: string;
  onBack: () => void;
};

export function SecurityStep({ userId: _userId, onBack }: Props) {
  const tCommon = useTranslations("common.labels");
  const tSecurity = useTranslations("app.onboarding.security");

  const [isPending, startTransition] = useTransition();

  function handleSetup() {
    startTransition(async () => {
      // TODO: Implement Signal Protocol key setup in Phase 4 (web client)
      await finishOnboarding();
    });
  }

  return (
    <div className="space-y-6">
      <Alert>
        <ShieldCheck />
        <AlertTitle>{tSecurity("e2ee_title")}</AlertTitle>
        <AlertDescription>{tSecurity("e2ee_description")}</AlertDescription>
      </Alert>

      <p className="text-muted-foreground text-center text-xs">{tSecurity("pin_hint")}</p>

      <div className="flex justify-between">
        <Button variant="outline" type="button" onClick={onBack} disabled={isPending}>
          {tCommon("back")}
        </Button>
        <Button onClick={handleSetup} disabled={isPending}>
          {isPending && <Loader2 className="animate-spin" />}
          {tSecurity("setup_pin")}
        </Button>
      </div>
    </div>
  );
}
