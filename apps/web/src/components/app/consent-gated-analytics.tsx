"use client";

import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { useSyncExternalStore } from "react";

const CONSENT_STORAGE_KEY = "openhospi_consent";

function getAnalyticsConsent(): boolean {
  try {
    const raw = localStorage.getItem(CONSENT_STORAGE_KEY);
    if (!raw) return false;
    const parsed = JSON.parse(raw) as Record<string, boolean>;
    return parsed.analytics === true;
  } catch {
    return false;
  }
}

function subscribe(callback: () => void) {
  window.addEventListener("openhospi:consent-change", callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener("openhospi:consent-change", callback);
    window.removeEventListener("storage", callback);
  };
}

function getServerSnapshot() {
  return false;
}

export function ConsentGatedAnalytics() {
  const allowed = useSyncExternalStore(subscribe, getAnalyticsConsent, getServerSnapshot);

  if (!allowed) return null;

  return (
    <>
      <Analytics />
      <SpeedInsights />
    </>
  );
}
