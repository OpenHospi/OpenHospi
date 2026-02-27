import {
  MAX_DECLINE_REASON_LENGTH,
  MAX_EVENT_DESCRIPTION_LENGTH,
  MAX_EVENT_LOCATION_LENGTH,
  MAX_EVENT_NOTES_LENGTH,
  MAX_EVENT_TITLE_LENGTH,
} from "@openhospi/shared/constants";
import { INVITATION_STATUSES } from "@openhospi/shared/enums";
import { createInsertSchema } from "drizzle-orm/zod";
import { z } from "zod";

import { hospiEvents } from "../schema/events";

export const createEventSchema = createInsertSchema(hospiEvents, {
  title: z.string().min(1).max(MAX_EVENT_TITLE_LENGTH),
  description: z.string().max(MAX_EVENT_DESCRIPTION_LENGTH).optional(),
  eventDate: z.string().min(1),
  timeStart: z.string().min(1),
  timeEnd: z.string().optional(),
  location: z.string().max(MAX_EVENT_LOCATION_LENGTH).optional(),
  notes: z.string().max(MAX_EVENT_NOTES_LENGTH).optional(),
  maxAttendees: z.coerce.number().int().min(1).optional(),
}).pick({
  title: true,
  description: true,
  eventDate: true,
  timeStart: true,
  timeEnd: true,
  location: true,
  rsvpDeadline: true,
  maxAttendees: true,
  notes: true,
});

export type CreateEventData = z.infer<typeof createEventSchema>;

export const rsvpSchema = z
  .object({
    status: z.enum(INVITATION_STATUSES),
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
