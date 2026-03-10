"use client";

import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

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

export function SafetyNumberDialog({ open, onOpenChange, otherUserName, getFingerprint }: Props) {
  const t = useTranslations("app.chat.safety_number");
  const [fingerprint, setFingerprint] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setLoading(true);
    getFingerprint().then((fp) => {
      if (!cancelled) {
        setFingerprint(fp);
        setLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [open, getFingerprint]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("title")}</DialogTitle>
          <DialogDescription>{t("description", { name: otherUserName })}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <span className="text-muted-foreground text-sm">{t("loading")}</span>
            </div>
          ) : fingerprint ? (
            <>
              <div className="bg-muted rounded-lg p-4 font-mono text-center text-lg tracking-wider select-all">
                {fingerprint}
              </div>
              <p className="text-muted-foreground text-sm">{t("instructions")}</p>
            </>
          ) : (
            <p className="text-muted-foreground py-4 text-center text-sm">{t("unavailable")}</p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
