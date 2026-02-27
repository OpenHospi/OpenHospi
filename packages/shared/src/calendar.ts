export type CalendarEvent = {
  uid: string;
  title: string;
  description?: string;
  location?: string;
  startDate: string; // YYYY-MM-DD
  startTime: string; // HH:MM
  endDate: string; // YYYY-MM-DD
  endTime: string; // HH:MM
  organizer?: string;
};

function escapeICS(text: string): string {
  return text
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\n/g, "\\n");
}

function formatICSDateTime(date: string, time: string): string {
  // date: YYYY-MM-DD, time: HH:MM -> YYYYMMDDTHHMMSS
  return date.replace(/-/g, "") + "T" + time.replace(/:/g, "") + "00";
}

/**
 * Compute end date+time from start date+time and end time.
 * Handles wrap past midnight (e.g. start 22:00, end 01:00 → next day).
 */
export function computeEndDateTime(
  startDate: string,
  startTime: string,
  endTime: string,
): { endDate: string; endTime: string } {
  const [startH, startM] = startTime.split(":").map(Number);
  const [endH, endM] = endTime.split(":").map(Number);
  const startMinutes = startH * 60 + startM;
  const endMinutes = endH * 60 + endM;

  if (endMinutes <= startMinutes) {
    // Wraps past midnight — add one day to the date
    const d = new Date(startDate);
    d.setDate(d.getDate() + 1);
    const nextDate = d.toISOString().split("T")[0];
    return { endDate: nextDate, endTime };
  }

  return { endDate: startDate, endTime };
}

export function generateICS(event: CalendarEvent): string {
  const dtStart = formatICSDateTime(event.startDate, event.startTime);
  const dtEnd = formatICSDateTime(event.endDate, event.endTime);
  const now = new Date()
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\.\d{3}/, "");

  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//OpenHospi//Hospi Events//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${event.uid}`,
    `DTSTAMP:${now}`,
    `DTSTART;TZID=Europe/Amsterdam:${dtStart}`,
    `DTEND;TZID=Europe/Amsterdam:${dtEnd}`,
    `SUMMARY:${escapeICS(event.title)}`,
  ];

  if (event.description) {
    lines.push(`DESCRIPTION:${escapeICS(event.description)}`);
  }
  if (event.location) {
    lines.push(`LOCATION:${escapeICS(event.location)}`);
  }
  if (event.organizer) {
    lines.push(`ORGANIZER:${escapeICS(event.organizer)}`);
  }

  // 1-hour reminder
  lines.push(
    "BEGIN:VALARM",
    "TRIGGER:-PT1H",
    "ACTION:DISPLAY",
    `DESCRIPTION:${escapeICS(event.title)}`,
    "END:VALARM",
  );

  lines.push("END:VEVENT", "END:VCALENDAR");

  return lines.join("\r\n");
}
