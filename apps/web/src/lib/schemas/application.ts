import {
  MAX_PERSONAL_MESSAGE_LENGTH,
  MIN_PERSONAL_MESSAGE_LENGTH,
} from "@openhospi/shared/constants";
import { z } from "zod";

export const applyToRoomSchema = z.object({
  personal_message: z.string().min(MIN_PERSONAL_MESSAGE_LENGTH).max(MAX_PERSONAL_MESSAGE_LENGTH),
});

export type ApplyToRoomData = z.infer<typeof applyToRoomSchema>;
