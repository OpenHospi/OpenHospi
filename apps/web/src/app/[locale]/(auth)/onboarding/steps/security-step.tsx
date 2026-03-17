"use client";

import { setupKeysWithPIN } from "@openhospi/crypto";
import { PIN_LENGTH } from "@openhospi/shared/constants";
import { REGEXP_ONLY_DIGITS } from "input-otp";
import { Loader2, ShieldCheck } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { registerUserDevice, uploadKeyBackup } from "@/app/[locale]/(app)/chat/key-actions";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { Label } from "@/components/ui/label";
import { cryptoStore } from "@/lib/crypto";

import { finishOnboarding } from "../actions";

type Props = {
  userId: string;
  onBack: () => void;
};

export function SecurityStep({ userId: _userId, onBack }: Props) {
  const tCommon = useTranslations("common.labels");
  const tSecurity = useTranslations("app.onboarding.security");

  const [isPending, startTransition] = useTransition();
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [pinError, setPinError] = useState<string | null>(null);

  function handlePinSetup() {
    setPinError(null);

    if (pin.length !== PIN_LENGTH) {
      setPinError(tSecurity("pin_length_error"));
      return;
    }
    if (pin !== confirmPin) {
      setPinError(tSecurity("pin_mismatch"));
      return;
    }

    startTransition(async () => {
      try {
        // Generate all keys locally
        const result = await setupKeysWithPIN(cryptoStore, pin);

        // Register device with all keys in one call
        await registerUserDevice({
          registrationId: result.registrationId,
          identityKeyPublic: result.identityKeyPublic,
          platform: "web",
          signedPreKey: result.signedPreKey,
          oneTimePreKeys: result.oneTimePreKeys,
        });

        // Upload encrypted backup separately
        await uploadKeyBackup({
          encryptedPrivateKey: result.encryptedBackup.ciphertext,
          backupIv: result.encryptedBackup.iv,
          salt: result.encryptedBackup.salt,
        });
      } catch (error) {
        console.error("[SecurityStep] Encryption setup failed:", error);
        toast.error(tSecurity("setup_error"));
        return;
      }
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

      <div className="space-y-5">
        <div className="flex flex-col items-center gap-2">
          <Label>{tSecurity("enter_pin")}</Label>
          <InputOTP
            maxLength={PIN_LENGTH}
            pattern={REGEXP_ONLY_DIGITS}
            value={pin}
            onChange={setPin}
          >
            <InputOTPGroup>
              {Array.from({ length: PIN_LENGTH }, (_, i) => (
                <InputOTPSlot key={i} index={i} />
              ))}
            </InputOTPGroup>
          </InputOTP>
        </div>

        <div className="flex flex-col items-center gap-2">
          <Label>{tSecurity("confirm_pin")}</Label>
          <InputOTP
            maxLength={PIN_LENGTH}
            pattern={REGEXP_ONLY_DIGITS}
            value={confirmPin}
            onChange={setConfirmPin}
          >
            <InputOTPGroup>
              {Array.from({ length: PIN_LENGTH }, (_, i) => (
                <InputOTPSlot key={i} index={i} />
              ))}
            </InputOTPGroup>
          </InputOTP>
        </div>

        {pinError && (
          <Alert variant="destructive">
            <AlertDescription>{pinError}</AlertDescription>
          </Alert>
        )}

        <p className="text-muted-foreground text-center text-xs">{tSecurity("pin_hint")}</p>
      </div>

      <div className="flex justify-between">
        <Button variant="outline" type="button" onClick={onBack} disabled={isPending}>
          {tCommon("back")}
        </Button>
        <Button
          onClick={handlePinSetup}
          disabled={isPending || pin.length !== PIN_LENGTH || confirmPin.length !== PIN_LENGTH}
        >
          {isPending && <Loader2 className="animate-spin" />}
          {tSecurity("setup_pin")}
        </Button>
      </div>
    </div>
  );
}
