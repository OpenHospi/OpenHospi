export type CalendarEvent = {
  uid: string;
  title: string;
  description?: string;
  location?: string;
  startDate: string; // YYYY-MM-DD
  startTime: string; // HH:MM or HH:MM:SS
  endDate: string; // YYYY-MM-DD
  endTime: string; // HH:MM or HH:MM:SS
  organizer?: string;
  sequence?: number;
  status?: "CONFIRMED" | "CANCELLED";
  created?: Date;
  lastModified?: Date;
};

function escapeICS(text: string): string {
  return text
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\n/g, "\\n");
}

/**
 * RFC 5545 line folding: lines must be max 75 octets.
 * Continuation lines start with a single space.
 */
function foldLine(line: string): string {
  const MAX_OCTETS = 75;
  const encoder = new TextEncoder();
  const bytes = encoder.encode(line);

  if (bytes.length <= MAX_OCTETS) return line;

  const parts: string[] = [];
  let start = 0;

  while (start < line.length) {
    // For the first chunk, max is 75 octets; for continuation, 74 (space prefix takes 1)
    const maxLen = start === 0 ? MAX_OCTETS : MAX_OCTETS - 1;
    let end = start;
    let byteCount = 0;

    while (end < line.length) {
      const charBytes = encoder.encode(line[end]).length;
      if (byteCount + charBytes > maxLen) break;
      byteCount += charBytes;
      end++;
    }

    if (end === start) {
      // Single character exceeds limit (shouldn't happen with UTF-8 in 75 bytes)
      end = start + 1;
    }

    parts.push((start === 0 ? "" : " ") + line.slice(start, end));
    start = end;
  }

  return parts.join("\r\n");
}

/**
 * Normalize time to HH:MM format, stripping seconds if present.
 */
function normalizeTime(time: string): string {
  return time.slice(0, 5);
}

function formatICSDateTime(date: string, time: string): string {
  const t = normalizeTime(time);
  // date: YYYY-MM-DD, time: HH:MM -> YYYYMMDDTHHMMSS
  return date.replace(/-/g, "") + "T" + t.replace(/:/g, "") + "00";
}

function formatICSTimestamp(d: Date): string {
  return d
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\.\d{3}/, "");
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
  const st = normalizeTime(startTime);
  const et = normalizeTime(endTime);
  const [startH, startM] = st.split(":").map(Number);
  const [endH, endM] = et.split(":").map(Number);
  const startMinutes = startH * 60 + startM;
  const endMinutes = endH * 60 + endM;

  if (endMinutes <= startMinutes) {
    const d = new Date(startDate);
    d.setDate(d.getDate() + 1);
    const nextDate = d.toISOString().split("T")[0];
    return { endDate: nextDate, endTime: et };
  }

  return { endDate: startDate, endTime: et };
}

// VTIMEZONE for Europe/Amsterdam (CET/CEST)
const VTIMEZONE_AMSTERDAM = [
  "BEGIN:VTIMEZONE",
  "TZID:Europe/Amsterdam",
  "BEGIN:STANDARD",
  "DTSTART:19701025T030000",
  "RRULE:FREQ=YEARLY;BYDAY=-1SU;BYMONTH=10",
  "TZOFFSETFROM:+0200",
  "TZOFFSETTO:+0100",
  "TZNAME:CET",
  "END:STANDARD",
  "BEGIN:DAYLIGHT",
  "DTSTART:19700329T020000",
  "RRULE:FREQ=YEARLY;BYDAY=-1SU;BYMONTH=3",
  "TZOFFSETFROM:+0100",
  "TZOFFSETTO:+0200",
  "TZNAME:CEST",
  "END:DAYLIGHT",
  "END:VTIMEZONE",
].join("\r\n");

function buildVEvent(event: CalendarEvent): string[] {
  const dtStart = formatICSDateTime(event.startDate, event.startTime);
  const dtEnd = formatICSDateTime(event.endDate, event.endTime);
  const now = formatICSTimestamp(new Date());

  const lines: string[] = [
    "BEGIN:VEVENT",
    `UID:${escapeICS(event.uid)}`,
    `DTSTAMP:${now}`,
    `DTSTART;TZID=Europe/Amsterdam:${dtStart}`,
    `DTEND;TZID=Europe/Amsterdam:${dtEnd}`,
    `SUMMARY:${escapeICS(event.title)}`,
  ];

  if (event.sequence != null) {
    lines.push(`SEQUENCE:${event.sequence}`);
  }
  if (event.status) {
    lines.push(`STATUS:${event.status}`);
  }
  if (event.created) {
    lines.push(`CREATED:${formatICSTimestamp(event.created)}`);
  }
  if (event.lastModified) {
    lines.push(`LAST-MODIFIED:${formatICSTimestamp(event.lastModified)}`);
  }
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

  lines.push("END:VEVENT");

  return lines.map(foldLine);
}

export function generateICS(event: CalendarEvent): string {
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//OpenHospi//Hospi Events//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    VTIMEZONE_AMSTERDAM,
    ...buildVEvent(event),
    "END:VCALENDAR",
  ];

  return lines.join("\r\n");
}

export function generateICSFeed(events: CalendarEvent[]): string {
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//OpenHospi//Hospi Events//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "X-WR-CALNAME:OpenHospi",
    VTIMEZONE_AMSTERDAM,
  ];

  for (const event of events) {
    lines.push(...buildVEvent(event));
  }

  lines.push("END:VCALENDAR");
  return lines.join("\r\n");
}
