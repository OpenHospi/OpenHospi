"use client";

import { SiApple, SiGooglecalendar } from "@icons-pack/react-simple-icons";
import { computeEndDateTime } from "@openhospi/shared/calendar";
import { OutlookIcon } from "@openhospi/shared/icons";
import { CalendarPlus, Download, Link2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type Props = {
  uid: string;
  calendarToken?: string | null;
  title: string;
  startDate: string; // YYYY-MM-DD
  startTime: string; // HH:MM or HH:MM:SS
  endTime?: string | null;
  location?: string | null;
  description?: string | null;
};

function toGoogleDateTime(date: string, time: string): string {
  const t = time.slice(0, 5);
  return date.replaceAll("-", "") + "T" + t.replaceAll(":", "") + "00";
}

function toOutlookDateTime(date: string, time: string): string {
  const t = time.slice(0, 5);
  return `${date}T${t}:00`;
}

function addHours(time: string, hours: number): string {
  const t = time.slice(0, 5);
  const [h, m] = t.split(":").map(Number);
  const newH = (h + hours) % 24;
  return `${String(newH).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export function AddToCalendarButton({
  uid,
  calendarToken,
  title,
  startDate,
  startTime,
  endTime,
  location,
  description,
}: Props) {
  const t = useTranslations("app.rooms.events");

  const effectiveEndTime = endTime ?? addHours(startTime, 2);
  const end = computeEndDateTime(startDate, startTime, effectiveEndTime);
  const feedUrl = calendarToken ? `${window.location.origin}/api/calendar/${calendarToken}` : null;
  const isLocalhost =
    typeof window !== "undefined" &&
    (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1");
  const showSubscribe = !!feedUrl && !isLocalhost;

  // ── Google Calendar ──

  function handleGoogleEvent() {
    const params = new URLSearchParams({
      action: "TEMPLATE",
      text: title,
      dates: `${toGoogleDateTime(startDate, startTime)}/${toGoogleDateTime(end.endDate, end.endTime)}`,
      ctz: "Europe/Amsterdam",
    });
    if (location) params.set("location", location);
    if (description) params.set("details", description);
    window.open(`https://calendar.google.com/calendar/render?${params.toString()}`, "_blank");
  }

  function handleGoogleSubscribe() {
    if (!feedUrl) return;
    window.open(
      `https://calendar.google.com/calendar/r?cid=${encodeURIComponent(feedUrl)}`,
      "_blank",
    );
  }

  // ── Outlook ──

  function handleOutlookEvent() {
    const params = new URLSearchParams({
      subject: title,
      startdt: toOutlookDateTime(startDate, startTime),
      enddt: toOutlookDateTime(end.endDate, end.endTime),
      path: "/calendar/action/compose",
      rru: "addevent",
    });
    if (location) params.set("location", location);
    if (description) params.set("body", description);
    window.open(
      `https://outlook.live.com/calendar/0/action/compose?${params.toString()}`,
      "_blank",
    );
  }

  function handleOutlookSubscribe() {
    if (!feedUrl) return;
    const params = new URLSearchParams({
      url: feedUrl,
      name: "OpenHospi",
    });
    window.open(`https://outlook.live.com/calendar/0/addfromweb?${params.toString()}`, "_blank");
  }

  // ── Apple Calendar (.ics / webcal) ──

  function handleAppleDownload() {
    window.open(`/api/calendar/event/${uid}`, "_blank");
  }

  async function handleAppleSubscribe() {
    if (!feedUrl) return;
    const webcalUrl = feedUrl.replace(/^https?:/, "webcal:");
    try {
      await navigator.clipboard.writeText(feedUrl);
      toast.success(t("calendarUrlCopied"));
    } catch {
      // Clipboard failed — still try webcal
    }
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
        {/* Google Calendar */}
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            <SiGooglecalendar className="size-4" />
            Google Calendar
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            <DropdownMenuItem onClick={handleGoogleEvent}>
              <CalendarPlus className="size-4" />
              {t("addSingleEvent")}
            </DropdownMenuItem>
            {showSubscribe && (
              <DropdownMenuItem onClick={handleGoogleSubscribe}>
                <Link2 className="size-4" />
                {t("subscribeAll")}
              </DropdownMenuItem>
            )}
          </DropdownMenuSubContent>
        </DropdownMenuSub>

        {/* Apple Calendar */}
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            <SiApple className="size-4" />
            Apple Calendar
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            <DropdownMenuItem onClick={handleAppleDownload}>
              <Download className="size-4" />
              {t("addSingleEvent")}
            </DropdownMenuItem>
            {showSubscribe && (
              <DropdownMenuItem onClick={handleAppleSubscribe}>
                <Link2 className="size-4" />
                {t("subscribeAll")}
              </DropdownMenuItem>
            )}
          </DropdownMenuSubContent>
        </DropdownMenuSub>

        {/* Outlook */}
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            <OutlookIcon className="size-4" />
            Outlook
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            <DropdownMenuItem onClick={handleOutlookEvent}>
              <CalendarPlus className="size-4" />
              {t("addSingleEvent")}
            </DropdownMenuItem>
            {showSubscribe && (
              <DropdownMenuItem onClick={handleOutlookSubscribe}>
                <Link2 className="size-4" />
                {t("subscribeAll")}
              </DropdownMenuItem>
            )}
          </DropdownMenuSubContent>
        </DropdownMenuSub>

        {/* Fallback .ics download */}
        <DropdownMenuItem onClick={handleAppleDownload}>
          <Download className="size-4" />
          {t("downloadIcs")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
