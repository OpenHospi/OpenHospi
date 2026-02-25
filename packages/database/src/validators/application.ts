import {
  MAX_PERSONAL_MESSAGE_LENGTH,
  MIN_PERSONAL_MESSAGE_LENGTH,
} from "@openhospi/shared/constants";
import { createInsertSchema } from "drizzle-orm/zod";
import { z } from "zod";

import { applications } from "../schema/applications";

export const applyToRoomSchema = createInsertSchema(applications, {
  personalMessage: z.string().min(MIN_PERSONAL_MESSAGE_LENGTH).max(MAX_PERSONAL_MESSAGE_LENGTH),
}).pick({
  personalMessage: true,
});

export type ApplyToRoomData = z.infer<typeof applyToRoomSchema>;
