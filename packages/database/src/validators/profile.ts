import {
  MAX_BIO_LENGTH,
  MAX_INSTAGRAM_HANDLE_LENGTH,
  MAX_LIFESTYLE_TAGS,
  MAX_STUDY_PROGRAM_LENGTH,
  MIN_LIFESTYLE_TAGS,
} from "@openhospi/shared/constants";
import { CITIES, GENDERS, LIFESTYLE_TAGS, STUDY_LEVELS, VERENIGINGEN } from "@openhospi/shared/enums";
import { createInsertSchema } from "drizzle-orm/zod";
import { z } from "zod";

import { profiles } from "../schema/profiles";

const baseProfileSchema = createInsertSchema(profiles, {
  gender: z.enum(GENDERS),
  birthDate: z.string().min(1),
  studyProgram: z.string().min(1).max(MAX_STUDY_PROGRAM_LENGTH),
  studyLevel: z.enum(STUDY_LEVELS).optional(),
  bio: z.string().max(MAX_BIO_LENGTH).optional(),
  lifestyleTags: z.array(z.enum(LIFESTYLE_TAGS)).min(MIN_LIFESTYLE_TAGS).max(MAX_LIFESTYLE_TAGS),
  preferredCity: z.enum(CITIES),
  maxRent: z.coerce.number().int().min(0).max(5000).optional(),
  availableFrom: z.string().min(1),
  vereniging: z.enum(VERENIGINGEN).optional(),
  instagramHandle: z.string().max(MAX_INSTAGRAM_HANDLE_LENGTH).optional(),
  showInstagram: z.boolean().optional(),
});

export const aboutStepSchema = baseProfileSchema.pick({
  gender: true,
  birthDate: true,
  studyProgram: true,
  studyLevel: true,
  bio: true,
});

export const personalityStepSchema = baseProfileSchema.pick({
  lifestyleTags: true,
});

export const preferencesStepSchema = baseProfileSchema.pick({
  preferredCity: true,
  maxRent: true,
  availableFrom: true,
  vereniging: true,
  instagramHandle: true,
  showInstagram: true,
});

export const editProfileSchema = baseProfileSchema.pick({
  gender: true,
  birthDate: true,
  studyProgram: true,
  studyLevel: true,
  bio: true,
  lifestyleTags: true,
  preferredCity: true,
  maxRent: true,
  availableFrom: true,
  vereniging: true,
  instagramHandle: true,
  showInstagram: true,
});

export type AboutStepData = z.infer<typeof aboutStepSchema>;
export type PersonalityStepData = z.infer<typeof personalityStepSchema>;
export type PreferencesStepData = z.infer<typeof preferencesStepSchema>;
export type EditProfileData = z.infer<typeof editProfileSchema>;
