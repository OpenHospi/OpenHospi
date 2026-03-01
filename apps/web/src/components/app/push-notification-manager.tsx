"use client";

import { BellOff, BellRing } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useState } from "react";

import { subscribePush, unsubscribePush } from "@/app/[locale]/(app)/push-actions";
import { Button } from "@/components/ui/button";

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replaceAll("-", "+").replaceAll("_", "/");
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i++) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function PushNotificationManager() {
  const t = useTranslations("app.push");
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) return;
    setIsSupported(true);

    navigator.serviceWorker.register("/sw.js").then((registration) => {
      registration.pushManager.getSubscription().then((sub) => {
        setIsSubscribed(!!sub);
      });
    });
  }, []);

  const handleSubscribe = useCallback(async () => {
    setIsLoading(true);
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(
          process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
        ).buffer as ArrayBuffer,
      });

      const json = subscription.toJSON();
      await subscribePush({
        endpoint: json.endpoint!,
        keys: {
          p256dh: json.keys!.p256dh!,
          auth: json.keys!.auth!,
        },
      });

      setIsSubscribed(true);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleUnsubscribe = useCallback(async () => {
    setIsLoading(true);
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      if (subscription) {
        await unsubscribePush(subscription.endpoint);
        await subscription.unsubscribe();
      }
      setIsSubscribed(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  if (!isSupported) {
    return (
      <p className="text-muted-foreground text-sm">{t("unsupported")}</p>
    );
  }

  return isSubscribed ? (
    <Button
      variant="outline"
      size="sm"
      onClick={handleUnsubscribe}
      disabled={isLoading}
    >
      <BellOff className="mr-2 size-4" />
      {t("disable")}
    </Button>
  ) : (
    <Button
      variant="outline"
      size="sm"
      onClick={handleSubscribe}
      disabled={isLoading}
    >
      <BellRing className="mr-2 size-4" />
      {t("enable")}
    </Button>
  );
}
