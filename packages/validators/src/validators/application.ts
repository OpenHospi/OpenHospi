import {
  MAX_PERSONAL_MESSAGE_LENGTH,
  MIN_PERSONAL_MESSAGE_LENGTH,
} from "@openhospi/shared/constants";
import { z } from "zod";

export const applyToRoomSchema = z.object({
  personalMessage: z
    .string()
    .min(MIN_PERSONAL_MESSAGE_LENGTH, { message: "min_length" })
    .max(MAX_PERSONAL_MESSAGE_LENGTH, { message: "max_length" }),
});

export type ApplyToRoomData = z.infer<typeof applyToRoomSchema>;
