"use client";

import { REGEXP_ONLY_DIGITS } from "input-otp";
import { Loader2, MailCheck, RotateCcw } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { Label } from "@/components/ui/label";

import { resendEmailCode, verifyEmailCode } from "../actions";

const OTP_LENGTH = 6;
const RESEND_COOLDOWN_SECONDS = 60;

type Props = {
  email: string;
  onBack: () => void;
  onVerified: () => void;
};

export function EmailVerificationStep({ email, onBack, onVerified }: Props) {
  const t = useTranslations("app.onboarding");
  const tCommon = useTranslations("common.labels");
  const [code, setCode] = useState("");
  const [cooldown, setCooldown] = useState(RESEND_COOLDOWN_SECONDS);
  const [isVerifying, startVerifyTransition] = useTransition();
  const [isResending, startResendTransition] = useTransition();

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown((value) => value - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  function handleVerify() {
    startVerifyTransition(async () => {
      const result = await verifyEmailCode({ email, code });
      if (result?.error) {
        toast.error(t(`identity.${result.error}`));
        return;
      }
      toast.success(t("identity.verified"));
      onVerified();
    });
  }

  function handleResend() {
    startResendTransition(async () => {
      const result = await resendEmailCode({ email });
      if (result?.error) {
        toast.error(t(`identity.${result.error}`));
        return;
      }

      setCode("");
      setCooldown(RESEND_COOLDOWN_SECONDS);
      toast.success(t("identity.verificationResent"));
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("identity.enterCodeTitle")}</CardTitle>
        <CardDescription>{t("identity.enterCodeDescription", { email })}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <Alert>
          <MailCheck className="size-4" />
          <AlertDescription>{t("identity.codeHint")}</AlertDescription>
        </Alert>

        <div className="flex flex-col items-center gap-2">
          <Label htmlFor="verification-code">{t("identity.verificationCode")}</Label>
          <InputOTP
            id="verification-code"
            maxLength={OTP_LENGTH}
            pattern={REGEXP_ONLY_DIGITS}
            value={code}
            onChange={setCode}
          >
            <InputOTPGroup>
              {Array.from({ length: OTP_LENGTH }, (_, i) => (
                <InputOTPSlot key={i} index={i} />
              ))}
            </InputOTPGroup>
          </InputOTP>
        </div>

        <div className="flex flex-wrap justify-between gap-2">
          <Button
            variant="outline"
            type="button"
            onClick={onBack}
            disabled={isVerifying || isResending}
          >
            {tCommon("back")}
          </Button>

          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              type="button"
              onClick={handleResend}
              disabled={cooldown > 0 || isVerifying || isResending}
            >
              {isResending ? <Loader2 className="animate-spin" /> : <RotateCcw />}
              {cooldown > 0
                ? t("identity.resendIn", { seconds: String(cooldown) })
                : t("identity.resendCode")}
            </Button>

            <Button
              type="button"
              onClick={handleVerify}
              disabled={code.length !== OTP_LENGTH || isVerifying || isResending}
            >
              {isVerifying && <Loader2 className="animate-spin" />}
              {t("identity.verifyCode")}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
