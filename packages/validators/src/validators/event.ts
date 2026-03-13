import {
  MAX_DECLINE_REASON_LENGTH,
  MAX_EVENT_DESCRIPTION_LENGTH,
  MAX_EVENT_LOCATION_LENGTH,
  MAX_EVENT_NOTES_LENGTH,
  MAX_EVENT_TITLE_LENGTH,
} from "@openhospi/shared/constants";
import { InvitationStatus } from "@openhospi/shared/enums";
import { z } from "zod";

export const createEventSchema = z.object({
  title: z.string().min(1).max(MAX_EVENT_TITLE_LENGTH),
  description: z.string().max(MAX_EVENT_DESCRIPTION_LENGTH).optional(),
  eventDate: z.string().min(1),
  timeStart: z.string().min(1),
  timeEnd: z.string().optional(),
  location: z.string().max(MAX_EVENT_LOCATION_LENGTH).optional(),
  rsvpDeadline: z.string().optional(),
  maxAttendees: z.coerce.number().int().min(1).optional(),
  notes: z.string().max(MAX_EVENT_NOTES_LENGTH).optional(),
});

export type CreateEventData = z.infer<typeof createEventSchema>;

export const rsvpSchema = z
  .object({
    status: z.enum(InvitationStatus.values),
    declineReason: z.string().max(MAX_DECLINE_REASON_LENGTH).optional(),
  })
  .refine(
    (data) =>
      data.status !== "not_attending" ||
      (typeof data.declineReason === "string" && data.declineReason.trim().length > 0),
    {
      message: "Decline reason is required when not attending",
      path: ["declineReason"],
    },
  );

export type RsvpData = z.infer<typeof rsvpSchema>;
