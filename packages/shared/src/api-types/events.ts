export type EventSummary = {
  id: string;
  title: string;
  eventDate: string;
  timeStart: string;
  timeEnd: string | null;
  location: string | null;
  cancelledAt: string | null;
  createdAt: string;
  invitedCount: number;
  attendingCount: number;
};

export type EventInvitee = {
  invitationId: string;
  userId: string;
  firstName: string;
  lastName: string;
  avatarUrl: string | null;
  status: string | null;
  respondedAt: string | null;
  declineReason: string | null;
};

export type EventDetail = EventSummary & {
  roomId: string;
  createdBy: string;
  description: string | null;
  rsvpDeadline: string | null;
  maxAttendees: number | null;
  notes: string | null;
  invitees: EventInvitee[];
};
