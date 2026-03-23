import type { ReportStatus } from "./admin";
import type { ApplicationStatus, InvitationStatus, ReviewDecision } from "./applications";
import type { RoomStatus } from "./housing";

// ─── Transition maps ──────────────────────────────────────────────────────

export const VALID_INVITATION_TRANSITIONS: Record<InvitationStatus, readonly InvitationStatus[]> = {
  pending: ["attending", "not_attending", "maybe"],
  attending: ["not_attending"],
  maybe: ["attending", "not_attending"],
  not_attending: [],
} as const;

export function isValidInvitationTransition(from: InvitationStatus, to: InvitationStatus): boolean {
  return VALID_INVITATION_TRANSITIONS[from]?.includes(to) ?? false;
}

export const VALID_APPLICATION_TRANSITIONS: Record<
  ApplicationStatus,
  readonly ApplicationStatus[]
> = {
  sent: ["seen", "withdrawn"],
  seen: ["liked", "maybe", "rejected", "withdrawn"],
  liked: ["hospi", "maybe", "rejected", "withdrawn"],
  maybe: ["liked", "hospi", "rejected", "withdrawn"],
  rejected: ["liked", "maybe"],
  hospi: ["accepted", "not_chosen", "withdrawn"],
  accepted: [],
  not_chosen: [],
  withdrawn: [],
} as const;

export function isValidApplicationTransition(
  from: ApplicationStatus,
  to: ApplicationStatus,
): boolean {
  return VALID_APPLICATION_TRANSITIONS[from]?.includes(to) ?? false;
}

export const VALID_ROOM_TRANSITIONS: Record<RoomStatus, readonly RoomStatus[]> = {
  draft: ["active"],
  active: ["paused", "closed"],
  paused: ["active", "closed"],
  closed: [],
} as const;

export function isValidRoomTransition(from: RoomStatus, to: RoomStatus): boolean {
  return VALID_ROOM_TRANSITIONS[from]?.includes(to) ?? false;
}

export const VALID_REPORT_STATUS_TRANSITIONS: Record<ReportStatus, readonly ReportStatus[]> = {
  pending: ["reviewing", "dismissed"],
  reviewing: ["resolved", "dismissed"],
  resolved: [],
  dismissed: [],
} as const;

export function isValidReportStatusTransition(from: ReportStatus, to: ReportStatus): boolean {
  return VALID_REPORT_STATUS_TRANSITIONS[from]?.includes(to) ?? false;
}

// ─── Application status categories ────────────────────────────────────────

export const TERMINAL_APPLICATION_STATUSES: readonly ApplicationStatus[] = [
  "rejected",
  "accepted",
  "not_chosen",
  "withdrawn",
] as const;

export function isTerminalApplicationStatus(status: ApplicationStatus): boolean {
  return (TERMINAL_APPLICATION_STATUSES as readonly string[]).includes(status);
}

export const INVITABLE_APPLICATION_STATUSES: readonly ApplicationStatus[] = [
  "liked",
  "maybe",
] as const;

export const REVIEW_PHASE_STATUSES: readonly ApplicationStatus[] = [
  "seen",
  "liked",
  "maybe",
  "rejected",
] as const;

export function isReviewPhaseStatus(status: ApplicationStatus): boolean {
  return (REVIEW_PHASE_STATUSES as readonly string[]).includes(status);
}

export const REVIEW_DECISION_TO_APPLICATION_STATUS: Record<ReviewDecision, ApplicationStatus> = {
  like: "liked",
  maybe: "maybe",
  reject: "rejected",
};
