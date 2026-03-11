"use client";

import { useTranslations } from "next-intl";
import { QRCodeSVG } from "qrcode.react";
import { use, Suspense, useState } from "react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type FingerprintResult = {
  safetyNumber: string;
  qrPayload: string;
} | null;

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  otherUserName: string;
  getFingerprint: () => Promise<FingerprintResult>;
};

function FingerprintDisplay({ promise }: { promise: Promise<FingerprintResult> }) {
  const t = useTranslations("app.chat.safety_number");
  const result = use(promise);

  if (!result) {
    return <p className="text-muted-foreground py-4 text-center text-sm">{t("unavailable")}</p>;
  }

  return (
    <>
      <div className="flex justify-center">
        <div className="rounded-xl bg-white p-4 shadow-sm">
          <QRCodeSVG
            value={result.qrPayload}
            size={200}
            level="M"
            bgColor="#ffffff"
            fgColor="#000000"
          />
        </div>
      </div>

      <div className="bg-muted rounded-lg p-4 font-mono text-center text-lg tracking-wider select-all">
        {result.safetyNumber}
      </div>

      <p className="text-muted-foreground text-sm">{t("instructions")}</p>
    </>
  );
}

export function SafetyNumberDialog({ open, onOpenChange, otherUserName, getFingerprint }: Props) {
  const t = useTranslations("app.chat.safety_number");
  const [promise, setPromise] = useState<Promise<FingerprintResult> | null>(null);

  function handleOpenChange(isOpen: boolean) {
    if (isOpen) {
      setPromise(getFingerprint());
    } else {
      setPromise(null);
    }
    onOpenChange(isOpen);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("title")}</DialogTitle>
          <DialogDescription>{t("description", { name: otherUserName })}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {promise ? (
            <Suspense
              fallback={
                <div className="flex items-center justify-center py-8">
                  <span className="text-muted-foreground text-sm">{t("loading")}</span>
                </div>
              }
            >
              <FingerprintDisplay promise={promise} />
            </Suspense>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}
