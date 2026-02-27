"use client";

import { computeEndDateTime, generateICS } from "@openhospi/shared/calendar";
import { CalendarPlus } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";

type Props = {
  uid: string;
  title: string;
  description?: string;
  location?: string | null;
  startDate: string; // YYYY-MM-DD
  startTime: string; // HH:MM
  endTime?: string | null; // HH:MM
};

export function AddToCalendarButton({
  uid,
  title,
  description,
  location,
  startDate,
  startTime,
  endTime,
}: Props) {
  const t = useTranslations("app.rooms.events");

  function handleDownload() {
    const end = endTime
      ? computeEndDateTime(startDate, startTime, endTime)
      : computeEndDateTime(startDate, startTime, addHours(startTime, 2));

    const ics = generateICS({
      uid: `${uid}@openhospi.nl`,
      title,
      description: description ?? undefined,
      location: location ?? undefined,
      startDate,
      startTime,
      endDate: end.endDate,
      endTime: end.endTime,
    });

    const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${title.replace(/[^a-zA-Z0-9]/g, "_")}.ics`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <Button variant="outline" size="sm" onClick={handleDownload}>
      <CalendarPlus className="size-4" />
      {t("addToCalendar")}
    </Button>
  );
}

function addHours(time: string, hours: number): string {
  const [h, m] = time.split(":").map(Number);
  const newH = (h + hours) % 24;
  return `${String(newH).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}
