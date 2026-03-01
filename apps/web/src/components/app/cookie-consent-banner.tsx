"use client";

import { ConsentPurpose, type LegalBasis } from "@openhospi/shared/enums";
import { Cookie } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useRef, useState } from "react";

import { migrateGuestConsent, recordConsent } from "@/app/consent-actions";

import { Button } from "../ui/button";
import { Card, CardFooter, CardHeader, CardTitle } from "../ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
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
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    const stored = getStoredConsent();
    if (stored) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- Initializing from localStorage on mount; no cascading render risk
      setConsent(stored);
      migrateGuestConsent(consentToEntries(stored));
    } else {
      setVisible(true);
    }
  }, []);

  const handleSave = useCallback(async (newConsent: ConsentState) => {
    storeConsent(newConsent);
    setConsent(newConsent);
    setVisible(false);
    setManageOpen(false);
    await recordConsent(consentToEntries(newConsent));
  }, []);

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
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Cookie className="size-4" />
              {t("title")}
            </CardTitle>
            <p className="text-sm text-muted-foreground">{t("description")}</p>
          </CardHeader>
          <CardFooter className="flex flex-wrap gap-2 pt-0">
            <Button size="sm" onClick={acceptAll}>
              {t("acceptAll")}
            </Button>
            <Button size="sm" variant="outline" onClick={essentialOnly}>
              {t("essentialOnly")}
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setManageOpen(true)}>
              {t("manage")}
            </Button>
          </CardFooter>
        </Card>
      </div>

      <Dialog open={manageOpen} onOpenChange={setManageOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t("manageTitle")}</DialogTitle>
            <DialogDescription>{t("manageDescription")}</DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            {ConsentPurpose.values.map((purpose) => {
              const isEssential = purpose === ConsentPurpose.essential;
              return (
                <div
                  key={purpose}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div className="space-y-0.5 pr-4">
                    <p className="text-sm font-medium leading-none">
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
              );
            })}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={essentialOnly}>
              {t("essentialOnly")}
            </Button>
            <Button onClick={() => handleSave(consent)}>{t("savePreferences")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
