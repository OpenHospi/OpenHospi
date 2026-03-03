import type { ApplicationStatus } from "@openhospi/shared/enums";
import {
  Eye,
  Heart,
  HelpCircle,
  MinusCircle,
  Send,
  Trophy,
  Undo2,
  Users,
  XCircle,
} from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";

import type { StatusHistoryEntry } from "@/lib/applications";
import { cn } from "@/lib/utils";

type TimelineEntry =
  | StatusHistoryEntry
  | { toStatus: ApplicationStatus; changedAt: Date; fromStatus: null };

const STATUS_ICONS: Record<ApplicationStatus, typeof Send> = {
  sent: Send,
  seen: Eye,
  liked: Heart,
  maybe: HelpCircle,
  rejected: XCircle,
  hospi: Users,
  accepted: Trophy,
  not_chosen: MinusCircle,
  withdrawn: Undo2,
};

const STATUS_ICON_COLORS: Record<ApplicationStatus, string> = {
  sent: "bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300",
  seen: "bg-sky-100 text-sky-600 dark:bg-sky-900 dark:text-sky-300",
  liked: "bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-300",
  maybe: "bg-yellow-100 text-yellow-600 dark:bg-yellow-900 dark:text-yellow-300",
  rejected: "bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-300",
  hospi: "bg-purple-100 text-purple-600 dark:bg-purple-900 dark:text-purple-300",
  accepted: "bg-emerald-100 text-emerald-600 dark:bg-emerald-900 dark:text-emerald-300",
  not_chosen: "bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-300",
  withdrawn: "bg-muted text-muted-foreground",
};

type Props = {
  history: StatusHistoryEntry[];
  appliedAt: Date;
  currentStatus: ApplicationStatus;
  updatedAt: Date;
};

export function ApplicationTimeline({ history, appliedAt, currentStatus, updatedAt }: Props) {
  const t = useTranslations("app.applications.timeline");
  const format = useFormatter();

  // Build timeline entries: use history if available, otherwise fall back to appliedAt/updatedAt
  let entries: TimelineEntry[];
  if (history.length > 0) {
    entries = history;
  } else {
    entries = [
      { toStatus: "sent" as ApplicationStatus, changedAt: new Date(appliedAt), fromStatus: null },
    ];
    if (currentStatus !== "sent") {
      entries.push({ toStatus: currentStatus, changedAt: new Date(updatedAt), fromStatus: null });
    }
  }

  return (
    <div className="relative space-y-0">
      {entries.map((entry, index) => {
        const isLast = index === entries.length - 1;
        const status = entry.toStatus as ApplicationStatus;
        const Icon = STATUS_ICONS[status];
        const iconColor = STATUS_ICON_COLORS[status];

        return (
          <div key={`${status}-${index}`} className="relative flex gap-4">
            {/* Left column: icon + connecting line */}
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  "relative z-10 flex size-8 shrink-0 items-center justify-center rounded-full",
                  iconColor,
                  isLast && "ring-2 ring-primary ring-offset-2 ring-offset-background",
                )}
              >
                <Icon className="size-4" />
              </div>
              {!isLast && <div className="w-px flex-1 bg-border" />}
            </div>

            {/* Right column: text */}
            <div className={cn("pb-6", isLast && "pb-0")}>
              <p className="text-sm font-medium leading-8">
                {t(status as Parameters<typeof t>[0])}
              </p>
              <p className="text-xs text-muted-foreground">
                {format.dateTime(new Date(entry.changedAt), {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
