import type { InvitationStatus } from "../enums";

export type UserInvitation = {
  invitationId: string;
  status: InvitationStatus;
  respondedAt: string | null;
  eventId: string;
  eventTitle: string;
  eventDate: string;
  timeStart: string;
  timeEnd: string | null;
  location: string | null;
  rsvpDeadline: string | null;
  roomId: string;
  roomTitle: string;
  cancelledAt: string | null;
};
