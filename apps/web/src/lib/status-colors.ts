import type { ApplicationStatus, RoomStatus } from "@openhospi/shared/enums";

export const APPLICATION_STATUS_COLORS: Record<ApplicationStatus, string> = {
  sent: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  seen: "bg-sky-100 text-sky-800 dark:bg-sky-900 dark:text-sky-200",
  liked: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  maybe: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  rejected: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  invited: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  attending: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200",
  not_attending: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200",
  accepted: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200",
  not_chosen: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  withdrawn: "bg-muted text-muted-foreground",
};

export const ROOM_STATUS_COLORS: Record<RoomStatus, string> = {
  draft: "bg-muted text-muted-foreground",
  active: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  paused: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  closed: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
};
