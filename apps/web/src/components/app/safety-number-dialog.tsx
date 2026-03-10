"use client";

import { useTranslations } from "next-intl";
import { use, Suspense, useState } from "react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  otherUserName: string;
  getFingerprint: () => Promise<string | null>;
};

function FingerprintDisplay({ promise }: { promise: Promise<string | null> }) {
  const t = useTranslations("app.chat.safety_number");
  const fingerprint = use(promise);

  if (!fingerprint) {
    return <p className="text-muted-foreground py-4 text-center text-sm">{t("unavailable")}</p>;
  }

  return (
    <>
      <div className="bg-muted rounded-lg p-4 font-mono text-center text-lg tracking-wider select-all">
        {fingerprint}
      </div>
      <p className="text-muted-foreground text-sm">{t("instructions")}</p>
    </>
  );
}

export function SafetyNumberDialog({ open, onOpenChange, otherUserName, getFingerprint }: Props) {
  const t = useTranslations("app.chat.safety_number");
  const [promise, setPromise] = useState<Promise<string | null> | null>(null);

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
