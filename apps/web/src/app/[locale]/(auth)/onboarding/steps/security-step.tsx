"use client";

import { PIN_LENGTH } from "@openhospi/shared/constants";
import { REGEXP_ONLY_DIGITS } from "input-otp";
import { Fingerprint, KeyRound, Loader2, Lock } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";

import { uploadKeyBackup, uploadPublicKey } from "@/app/[locale]/(app)/chat/key-actions";
import {
  generatePasskeyRegistration,
  verifyPasskeyRegistration,
} from "@/app/[locale]/(app)/chat/webauthn-actions";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { Label } from "@/components/ui/label";
import { setupKeysWithPasskey, setupKeysWithPIN } from "@/lib/key-management";
import { isPRFSupported } from "@/lib/passkey-crypto";

import { finishOnboarding } from "../actions";

type Props = {
  userId: string;
  onBack: () => void;
};

export function SecurityStep({ userId, onBack }: Props) {
  const tCommon = useTranslations("common.labels");
  const tSecurity = useTranslations("app.onboarding.security");

  const [isPending, startTransition] = useTransition();
  const [prfSupported, setPrfSupported] = useState<boolean | null>(null);
  const [mode, setMode] = useState<"choose" | "pin">("choose");
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [pinError, setPinError] = useState<string | null>(null);

  useEffect(() => {
    isPRFSupported().then(setPrfSupported);
  }, []);

  function handlePasskeySetup() {
    startTransition(async () => {
      try {
        await setupKeysWithPasskey(
          userId,
          generatePasskeyRegistration,
          verifyPasskeyRegistration,
          uploadPublicKey,
          uploadKeyBackup,
        );
        toast.success(tSecurity("setup_success"));
        await finishOnboarding();
      } catch (err) {
        if (err instanceof Error && err.message === "PRF_NOT_AVAILABLE_AT_REGISTRATION") {
          // PRF not available — fall back to PIN
          setMode("pin");
          toast.info(tSecurity("prf_fallback"));
        } else {
          toast.error(tSecurity("setup_error"));
        }
      }
    });
  }

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
        await setupKeysWithPIN(userId, pin, uploadPublicKey, uploadKeyBackup);
        toast.success(tSecurity("setup_success"));
        await finishOnboarding();
      } catch {
        toast.error(tSecurity("setup_error"));
      }
    });
  }

  const showPinForm = mode === "pin" || prfSupported === false;

  return (
    <div className="space-y-6">
      <Alert>
        <Lock className="h-4 w-4" />
        <AlertTitle>{tSecurity("e2ee_title")}</AlertTitle>
        <AlertDescription>{tSecurity("e2ee_description")}</AlertDescription>
      </Alert>

      {/* Loading PRF check */}
      {prfSupported === null && (
        <div className="flex items-center justify-center py-4">
          <Loader2 className="text-muted-foreground h-5 w-5 animate-spin" />
        </div>
      )}

      {/* Passkey + PIN choice */}
      {prfSupported !== null && !showPinForm && (
        <div className="space-y-3">
          <Button
            className="w-full justify-start gap-3"
            onClick={handlePasskeySetup}
            disabled={isPending}
          >
            {isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Fingerprint className="h-4 w-4" />
            )}
            {tSecurity("use_passkey")}
          </Button>

          <Button
            variant="outline"
            className="w-full justify-start gap-3"
            onClick={() => setMode("pin")}
            disabled={isPending}
          >
            <KeyRound className="h-4 w-4" />
            {tSecurity("use_pin")}
          </Button>
        </div>
      )}

      {/* Browser doesn't support passkeys for encryption */}
      {prfSupported === false && (
        <Alert variant="destructive">
          <AlertDescription>{tSecurity("prf_not_supported")}</AlertDescription>
        </Alert>
      )}

      {/* PIN form */}
      {showPinForm && prfSupported !== null && (
        <div className="space-y-4">
          <div className="space-y-2">
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

          <div className="space-y-2">
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

          <Button
            className="w-full"
            onClick={handlePinSetup}
            disabled={isPending || pin.length !== PIN_LENGTH || confirmPin.length !== PIN_LENGTH}
          >
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {tSecurity("setup_pin")}
          </Button>

          {mode === "pin" && prfSupported && (
            <Button
              variant="ghost"
              className="w-full"
              onClick={() => {
                setMode("choose");
                setPin("");
                setConfirmPin("");
                setPinError(null);
              }}
              disabled={isPending}
            >
              {tCommon("back")}
            </Button>
          )}
        </div>
      )}

      <div className="flex justify-between">
        <Button variant="outline" type="button" onClick={onBack} disabled={isPending}>
          {tCommon("back")}
        </Button>
      </div>
    </div>
  );
}
