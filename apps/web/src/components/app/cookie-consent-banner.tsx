"use client";

import { ConsentPurpose, type LegalBasis } from "@openhospi/shared/enums";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useState } from "react";

import { migrateGuestConsent, recordConsent } from "@/app/consent-actions";

import { Button } from "../ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "../ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Separator } from "../ui/separator";
import { Switch } from "../ui/switch";

const CONSENT_STORAGE_KEY = "openhospi_consent";

type ConsentState = Record<ConsentPurpose, boolean>;

const DEFAULT_CONSENT: ConsentState = {
  essential: true,
  functional: false,
  push_notifications: false,
  analytics: false,
};

const PURPOSE_LEGAL_BASIS: Record<ConsentPurpose, LegalBasis> = {
  essential: "contract",
  functional: "consent",
  push_notifications: "consent",
  analytics: "consent",
};

function getStoredConsent(): ConsentState | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(CONSENT_STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as ConsentState;
  } catch {
    return null;
  }
}

function storeConsent(consent: ConsentState) {
  localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(consent));
}

function consentToEntries(consent: ConsentState) {
  return ConsentPurpose.values.map((purpose) => ({
    purpose,
    granted: consent[purpose],
    legalBasis: PURPOSE_LEGAL_BASIS[purpose],
  }));
}

export function CookieConsentBanner() {
  const t = useTranslations("app.consent");
  const [visible, setVisible] = useState(false);
  const [manageOpen, setManageOpen] = useState(false);
  const [consent, setConsent] = useState<ConsentState>(DEFAULT_CONSENT);

  useEffect(() => {
    const stored = getStoredConsent();
    if (stored) {
      setConsent(stored);
      // Already consented — try migrating to DB (no-op if already migrated)
      migrateGuestConsent(consentToEntries(stored));
    } else {
      setVisible(true);
    }
  }, []);

  const handleSave = useCallback(
    async (newConsent: ConsentState) => {
      storeConsent(newConsent);
      setConsent(newConsent);
      setVisible(false);
      setManageOpen(false);
      await recordConsent(consentToEntries(newConsent));
    },
    [],
  );

  const acceptAll = useCallback(() => {
    handleSave({
      essential: true,
      functional: true,
      push_notifications: true,
      analytics: true,
    });
  }, [handleSave]);

  const essentialOnly = useCallback(() => {
    handleSave({ ...DEFAULT_CONSENT });
  }, [handleSave]);

  if (!visible) return null;

  return (
    <>
      <div className="fixed inset-x-0 bottom-0 z-50 p-4 sm:flex sm:justify-center">
        <Card className="w-full shadow-lg sm:max-w-lg">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">{t("title")}</CardTitle>
          </CardHeader>
          <CardContent className="pb-3">
            <p className="text-sm text-muted-foreground">{t("description")}</p>
          </CardContent>
          <CardFooter className="flex flex-wrap gap-2">
            <Button size="sm" onClick={acceptAll}>
              {t("acceptAll")}
            </Button>
            <Button size="sm" variant="outline" onClick={essentialOnly}>
              {t("essentialOnly")}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setManageOpen(true)}
            >
              {t("manage")}
            </Button>
          </CardFooter>
        </Card>
      </div>

      <Dialog open={manageOpen} onOpenChange={setManageOpen}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t("manageTitle")}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {ConsentPurpose.values.map((purpose) => {
              const isEssential = purpose === ConsentPurpose.essential;
              return (
                <div key={purpose}>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <p className="text-sm font-medium">
                        {t(`purposes.${purpose}.name`)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {t(`purposes.${purpose}.description`)}
                      </p>
                    </div>
                    <Switch
                      checked={consent[purpose]}
                      disabled={isEssential}
                      onCheckedChange={(checked) =>
                        setConsent((prev) => ({ ...prev, [purpose]: checked }))
                      }
                    />
                  </div>
                  {purpose !== ConsentPurpose.analytics && (
                    <Separator className="mt-4" />
                  )}
                </div>
              );
            })}
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={essentialOnly}>
              {t("essentialOnly")}
            </Button>
            <Button onClick={() => handleSave(consent)}>
              {t("savePreferences")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
