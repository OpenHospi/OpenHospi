"use client";

import { recoverKeysWithPIN, resetKeys, setupKeysWithPIN } from "@openhospi/crypto";
import { PIN_LENGTH } from "@openhospi/shared/constants";
import { REGEXP_ONLY_DIGITS } from "input-otp";
import { KeyRound, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";

import {
  deleteKeyBackup,
  fetchKeyBackup,
  uploadIdentityKey,
  uploadKeyBackup,
  uploadOneTimePreKeys,
  uploadSignedPreKey,
} from "@/app/[locale]/(app)/chat/key-actions";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { Label } from "@/components/ui/label";
import { cryptoStore } from "@/lib/crypto";

type Props = {
  userId: string;
};

type BackupInfo = {
  encryptedPrivateKey: string;
  backupIv: string;
  salt: string;
} | null;

export function KeyRecoveryDialog({ userId }: Props) {
  const t = useTranslations("app.chat.encryption");
  const tCommon = useTranslations("common.labels");

  const [isPending, startTransition] = useTransition();
  const [backup, setBackup] = useState<BackupInfo>(undefined as unknown as BackupInfo);
  const [loading, setLoading] = useState(true);
  const [pin, setPin] = useState("");
  const [pinError, setPinError] = useState<string | null>(null);
  const [showSetup, setShowSetup] = useState(false);
  const [setupPin, setSetupPin] = useState("");
  const [setupConfirmPin, setSetupConfirmPin] = useState("");
  const [setupPinError, setSetupPinError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const backupResult = await fetchKeyBackup();
      setBackup(backupResult);
      setLoading(false);
    })();
  }, []);

  function handlePinRecovery() {
    if (!backup) return;
    setPinError(null);

    if (pin.length !== PIN_LENGTH) return;

    startTransition(async () => {
      try {
        await recoverKeysWithPIN(cryptoStore, userId, pin, backup, {
          uploadIdentityKey,
          uploadSignedPreKey,
          uploadOneTimePreKeys,
        });
        toast.success(t("recovery_success"));
        window.location.reload();
      } catch {
        setPinError(t("wrong_pin"));
      }
    });
  }

  function handleStartFresh() {
    startTransition(async () => {
      try {
        await resetKeys(cryptoStore, userId, {
          deleteBackup: deleteKeyBackup,
        });
        setShowSetup(true);
        setBackup(null);
      } catch {
        toast.error(t("reset_error"));
      }
    });
  }

  function handleSetupPin() {
    setSetupPinError(null);

    if (setupPin.length !== PIN_LENGTH) {
      setSetupPinError(t("pin_length_error"));
      return;
    }
    if (setupPin !== setupConfirmPin) {
      setSetupPinError(t("pin_mismatch"));
      return;
    }

    startTransition(async () => {
      try {
        await setupKeysWithPIN(cryptoStore, userId, setupPin, {
          uploadIdentityKey,
          uploadSignedPreKey,
          uploadOneTimePreKeys,
          uploadBackup: uploadKeyBackup,
        });
        toast.success(t("setup_success"));
        window.location.reload();
      } catch {
        toast.error(t("setup_error"));
      }
    });
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="text-muted-foreground h-6 w-6 animate-spin" />
      </div>
    );
  }

  // After key reset — show setup flow
  if (showSetup || !backup) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>{t("setup_title")}</CardTitle>
          <CardDescription>{t("setup_description")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="space-y-2">
              <Label>{t("enter_pin")}</Label>
              <InputOTP
                maxLength={PIN_LENGTH}
                pattern={REGEXP_ONLY_DIGITS}
                value={setupPin}
                onChange={setSetupPin}
              >
                <InputOTPGroup>
                  {Array.from({ length: PIN_LENGTH }, (_, i) => (
                    <InputOTPSlot key={i} index={i} />
                  ))}
                </InputOTPGroup>
              </InputOTP>
            </div>

            <div className="space-y-2">
              <Label>{t("confirm_pin")}</Label>
              <InputOTP
                maxLength={PIN_LENGTH}
                pattern={REGEXP_ONLY_DIGITS}
                value={setupConfirmPin}
                onChange={setSetupConfirmPin}
              >
                <InputOTPGroup>
                  {Array.from({ length: PIN_LENGTH }, (_, i) => (
                    <InputOTPSlot key={i} index={i} />
                  ))}
                </InputOTPGroup>
              </InputOTP>
            </div>

            {setupPinError && (
              <Alert variant="destructive">
                <AlertDescription>{setupPinError}</AlertDescription>
              </Alert>
            )}

            <Button
              className="w-full"
              onClick={handleSetupPin}
              disabled={
                isPending || setupPin.length !== PIN_LENGTH || setupConfirmPin.length !== PIN_LENGTH
              }
            >
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <KeyRound className="mr-2 h-4 w-4" />
              {t("setup_with_pin")}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Recovery flow
  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>{t("unlock_title")}</CardTitle>
        <CardDescription>{t("unlock_description")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          <div className="space-y-2">
            <Label>{t("enter_pin")}</Label>
            <InputOTP
              maxLength={PIN_LENGTH}
              pattern={REGEXP_ONLY_DIGITS}
              value={pin}
              onChange={(val) => {
                setPin(val);
                setPinError(null);
              }}
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
            onClick={handlePinRecovery}
            disabled={isPending || pin.length !== PIN_LENGTH}
          >
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {t("unlock_pin")}
          </Button>
        </div>

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="ghost" className="text-muted-foreground w-full text-sm">
              {t("start_fresh")}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{t("start_fresh_title")}</AlertDialogTitle>
              <AlertDialogDescription>{t("start_fresh_warning")}</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{tCommon("cancel")}</AlertDialogCancel>
              <AlertDialogAction onClick={handleStartFresh} disabled={isPending}>
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {t("start_fresh_confirm")}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  );
}
