"use client";

import { Calendar, Copy, Eye, EyeOff, Loader2, RefreshCw } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";

import { PushNotificationManager } from "@/components/app/push-notification-manager";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getCalendarToken } from "@/lib/queries/calendar-token";

import { regenerateCalendarToken } from "./actions";

export function GeneralSettings() {
  const t = useTranslations("app.settings");

  const [calendarToken, setCalendarToken] = useState<string | null>(null);
  const [showCalendarUrl, setShowCalendarUrl] = useState(false);
  const [isRegeneratingToken, startRegenerateToken] = useTransition();

  useEffect(() => {
    getCalendarToken().then(setCalendarToken);
  }, []);

  async function handleCopyCalendarUrl() {
    if (!calendarToken) return;
    const url = `${window.location.origin}/api/calendar/${calendarToken}`;
    try {
      await navigator.clipboard.writeText(url);
      toast.success(t("calendar.urlCopied"));
    } catch {
      toast.error(t("calendar.urlCopied"));
    }
  }

  function handleRegenerateToken() {
    startRegenerateToken(async () => {
      const newToken = await regenerateCalendarToken();
      setCalendarToken(newToken);
      toast.success(t("calendar.regenerated"));
    });
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{t("pushNotifications.title")}</CardTitle>
          <CardDescription>{t("pushNotifications.description")}</CardDescription>
        </CardHeader>
        <CardContent>
          <PushNotificationManager />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="size-5" />
            {t("calendar.title")}
          </CardTitle>
          <CardDescription>{t("calendar.description")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {calendarToken && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <code className="bg-muted flex-1 truncate rounded-md px-3 py-2 text-sm">
                  {showCalendarUrl
                    ? `${window.location.origin}/api/calendar/${calendarToken}`
                    : "••••••••••••••••••••••••••••••••••••"}
                </code>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowCalendarUrl(!showCalendarUrl)}
                >
                  {showCalendarUrl ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </Button>
                <Button variant="ghost" size="icon" onClick={handleCopyCalendarUrl}>
                  <Copy className="size-4" />
                </Button>
              </div>
              <p className="text-muted-foreground text-xs">{t("calendar.warning")}</p>
            </div>
          )}
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleRegenerateToken}
              disabled={isRegeneratingToken}
            >
              {isRegeneratingToken ? (
                <Loader2 className="animate-spin" />
              ) : (
                <RefreshCw className="size-4" />
              )}
              {t("calendar.regenerateButton")}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
