"use client";

import { CalendarPlus, Download, Link2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type Props = {
  uid: string;
  calendarToken?: string | null;
};

export function AddToCalendarButton({ uid, calendarToken }: Props) {
  const t = useTranslations("app.rooms.events");

  function handleDownload() {
    // Use the authenticated API endpoint for single-event download
    window.open(`/api/calendar/event/${uid}`, "_blank");
  }

  function handleSubscribe() {
    if (!calendarToken) return;
    const subscribeUrl = `${window.location.origin}/api/calendar/${calendarToken}`;
    const webcalUrl = subscribeUrl.replace(/^https?:/, "webcal:");
    navigator.clipboard.writeText(subscribeUrl).then(() => {
      toast.success(t("calendarUrlCopied"));
    });
    // Also try to open webcal:// for native calendar apps
    window.open(webcalUrl);
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm">
          <CalendarPlus className="size-4" />
          {t("addToCalendar")}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        {calendarToken && (
          <DropdownMenuItem onClick={handleSubscribe}>
            <Link2 className="size-4" />
            {t("subscribeToCalendar")}
          </DropdownMenuItem>
        )}
        <DropdownMenuItem onClick={handleDownload}>
          <Download className="size-4" />
          {t("downloadIcs")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
