import { defineEnum } from "./utils/define-enum";

export const AdminAction = defineEnum([
  "view_report",
  "update_report",
  "suspend_user",
  "unsuspend_user",
  "remove_listing",
  "remove_message",
  "dismiss_report",
  "process_data_request",
  "lift_restriction",
  "export_user_data",
  "view_user_data",
  "moderate_photo",
] as const);
export type AdminAction = (typeof AdminAction.values)[number];

export const ReportReason = defineEnum([
  "spam",
  "harassment",
  "fake_profile",
  "inappropriate_content",
  "scam",
  "discrimination",
  "other",
] as const);
export type ReportReason = (typeof ReportReason.values)[number];

export const ReportType = defineEnum(["message", "user", "room"] as const);
export type ReportType = (typeof ReportType.values)[number];

export const ReportStatus = defineEnum(["pending", "reviewing", "resolved", "dismissed"] as const);
export type ReportStatus = (typeof ReportStatus.values)[number];
