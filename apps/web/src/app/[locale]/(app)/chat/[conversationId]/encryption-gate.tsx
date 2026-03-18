"use client";

import { PIN_LENGTH } from "@openhospi/shared/constants";
import { REGEXP_ONLY_DIGITS } from "input-otp";
import { Loader2, ShieldCheck } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState, useTransition } from "react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { Label } from "@/components/ui/label";
import { useEncryption } from "@/hooks/use-encryption";

type Props = {
  userId: string;
  children: React.ReactNode;
};

export function EncryptionGate({ userId, children }: Props) {
  const t = useTranslations("app.chat");
  const tSecurity = useTranslations("app.onboarding.security");
  const { status, checkStatus, initializeDevice } = useEncryption(userId);
  const [checked, setChecked] = useState(false);
  const [pin, setPin] = useState("");
  const [isPending, startTransition] = useTransition();
  const [setupError, setSetupError] = useState<string | null>(null);

  useEffect(() => {
    checkStatus().then(() => setChecked(true));
  }, [checkStatus]);

  if (!checked) return null;

  if (status === "ready") {
    return <>{children}</>;
  }

  function handleSetup() {
    if (pin.length !== PIN_LENGTH) return;
    setSetupError(null);

    startTransition(async () => {
      try {
        await initializeDevice(pin);
      } catch {
        setSetupError(tSecurity("setup_error"));
        setPin("");
      }
    });
  }

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6 p-8">
      <Alert className="max-w-md">
        <ShieldCheck />
        <AlertTitle>{tSecurity("e2ee_title")}</AlertTitle>
        <AlertDescription>{t("setup_required")}</AlertDescription>
      </Alert>

      <div className="flex max-w-md flex-col items-center gap-4">
        <Label>{tSecurity("enter_pin")}</Label>
        <InputOTP maxLength={PIN_LENGTH} pattern={REGEXP_ONLY_DIGITS} value={pin} onChange={setPin}>
          <InputOTPGroup>
            {Array.from({ length: PIN_LENGTH }, (_, i) => (
              <InputOTPSlot key={i} index={i} />
            ))}
          </InputOTPGroup>
        </InputOTP>

        <p className="text-muted-foreground text-center text-xs">{tSecurity("pin_hint")}</p>

        {setupError && (
          <Alert variant="destructive" className="max-w-md">
            <AlertDescription>{setupError}</AlertDescription>
          </Alert>
        )}

        <Button
          onClick={handleSetup}
          disabled={isPending || pin.length !== PIN_LENGTH}
          className="w-full max-w-xs"
        >
          {isPending && <Loader2 className="animate-spin" />}
          {tSecurity("setup_pin")}
        </Button>
      </div>
    </div>
  );
}
