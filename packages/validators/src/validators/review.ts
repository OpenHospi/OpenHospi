import { MAX_NOTES_LENGTH } from "@openhospi/shared/constants";
import { ReviewDecision } from "@openhospi/shared/enums";
import { z } from "zod";

export const reviewSchema = z.object({
  decision: z.enum(ReviewDecision.values),
  notes: z.string().max(MAX_NOTES_LENGTH).optional(),
});

export type ReviewData = z.infer<typeof reviewSchema>;
