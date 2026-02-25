import { MAX_NOTES_LENGTH } from "@openhospi/shared/constants";
import { REVIEW_DECISIONS } from "@openhospi/shared/enums";
import { createInsertSchema } from "drizzle-orm/zod";
import { z } from "zod";

import { reviews } from "../schema/applications";

export const reviewSchema = createInsertSchema(reviews, {
  decision: z.enum(REVIEW_DECISIONS),
  notes: z.string().max(MAX_NOTES_LENGTH).optional(),
}).pick({
  decision: true,
  notes: true,
});

export type ReviewData = z.infer<typeof reviewSchema>;
