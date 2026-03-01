import { ConsentPurpose, DataRequestType } from "@openhospi/shared/enums";
import { z } from "zod";

export const updateConsentSchema = z.object({
  purpose: z.enum(ConsentPurpose.values),
  granted: z.boolean(),
});

export const submitDataRequestSchema = z.object({
  type: z.enum(DataRequestType.values),
  description: z.string().min(10).max(2000),
});

export const requestProcessingRestrictionSchema = z.object({
  reason: z.string().min(10).max(2000),
});

export type UpdateConsentData = z.infer<typeof updateConsentSchema>;
export type SubmitDataRequestData = z.infer<typeof submitDataRequestSchema>;
export type RequestProcessingRestrictionData = z.infer<
  typeof requestProcessingRestrictionSchema
>;
