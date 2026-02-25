import {
  MAX_BIO_LENGTH,
  MAX_INSTAGRAM_HANDLE_LENGTH,
  MAX_LIFESTYLE_TAGS,
  MAX_STUDY_PROGRAM_LENGTH,
  MIN_LIFESTYLE_TAGS,
} from "@openhospi/shared/constants";
import { CITIES, GENDERS, LIFESTYLE_TAGS, STUDY_LEVELS, VERENIGINGEN } from "@openhospi/shared/enums";
import { z } from "zod";

export const aboutStepSchema = z.object({
  gender: z.enum(GENDERS),
  birth_date: z.string().min(1),
  study_program: z.string().min(1).max(MAX_STUDY_PROGRAM_LENGTH),
  study_level: z.enum(STUDY_LEVELS).optional(),
  bio: z.string().max(MAX_BIO_LENGTH).optional(),
});

export const personalityStepSchema = z.object({
  lifestyle_tags: z.array(z.enum(LIFESTYLE_TAGS)).min(MIN_LIFESTYLE_TAGS).max(MAX_LIFESTYLE_TAGS),
});

export const preferencesStepSchema = z.object({
  preferred_city: z.enum(CITIES),
  max_rent: z.coerce.number().int().min(0).max(5000).optional(),
  available_from: z.string().min(1),
  vereniging: z.enum(VERENIGINGEN).optional(),
  instagram_handle: z.string().max(MAX_INSTAGRAM_HANDLE_LENGTH).optional(),
  show_instagram: z.boolean().optional(),
});

export const editProfileSchema = z.object({
  gender: z.enum(GENDERS),
  birth_date: z.string().min(1),
  study_program: z.string().min(1).max(MAX_STUDY_PROGRAM_LENGTH),
  study_level: z.enum(STUDY_LEVELS).optional(),
  bio: z.string().max(MAX_BIO_LENGTH).optional(),
  lifestyle_tags: z.array(z.enum(LIFESTYLE_TAGS)).min(MIN_LIFESTYLE_TAGS).max(MAX_LIFESTYLE_TAGS),
  preferred_city: z.enum(CITIES),
  max_rent: z.coerce.number().int().min(0).max(5000).optional(),
  available_from: z.string().min(1),
  vereniging: z.enum(VERENIGINGEN).optional(),
  instagram_handle: z.string().max(MAX_INSTAGRAM_HANDLE_LENGTH).optional(),
  show_instagram: z.boolean().optional(),
});

export type AboutStepData = z.infer<typeof aboutStepSchema>;
export type PersonalityStepData = z.infer<typeof personalityStepSchema>;
export type PreferencesStepData = z.infer<typeof preferencesStepSchema>;
export type EditProfileData = z.infer<typeof editProfileSchema>;
