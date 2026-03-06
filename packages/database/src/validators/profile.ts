import {
  MAX_BIO_LENGTH,
  MAX_LANGUAGES,
  MAX_LIFESTYLE_TAGS,
  MAX_STUDY_PROGRAM_LENGTH,
  MIN_LANGUAGES,
  MIN_LIFESTYLE_TAGS,
} from "@openhospi/shared/constants";
import {
  City,
  Gender,
  Language,
  LifestyleTag,
  StudyLevel,
  Vereniging,
} from "@openhospi/shared/enums";
import { createInsertSchema } from "drizzle-orm/zod";
import { z } from "zod";

import { profiles } from "../schema/profiles";

const baseProfileSchema = createInsertSchema(profiles, {
  gender: z.enum(Gender.values),
  birthDate: z.string().min(1),
  studyProgram: z.string().min(1).max(MAX_STUDY_PROGRAM_LENGTH),
  studyLevel: z.enum(StudyLevel.values).optional(),
  bio: z.string().max(MAX_BIO_LENGTH).optional(),
  lifestyleTags: z
    .array(z.enum(LifestyleTag.values))
    .min(MIN_LIFESTYLE_TAGS)
    .max(MAX_LIFESTYLE_TAGS),
  languages: z.array(z.enum(Language.values)).min(MIN_LANGUAGES).max(MAX_LANGUAGES),
  preferredCity: z.enum(City.values),
  vereniging: z.enum(Vereniging.values).optional(),
});

export const identityStepSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email(),
});

export const aboutStepSchema = baseProfileSchema.pick({
  gender: true,
  birthDate: true,
  studyProgram: true,
  studyLevel: true,
  preferredCity: true,
  vereniging: true,
});

export const bioStepSchema = z.object({
  bio: z.string().min(1).max(MAX_BIO_LENGTH),
});

export const personalityStepSchema = baseProfileSchema.pick({
  lifestyleTags: true,
});

export const languagesStepSchema = baseProfileSchema.pick({
  languages: true,
});

export const editProfileSchema = baseProfileSchema.pick({
  gender: true,
  birthDate: true,
  studyProgram: true,
  studyLevel: true,
  bio: true,
  lifestyleTags: true,
  languages: true,
  preferredCity: true,
  vereniging: true,
});

export type IdentityStepData = z.infer<typeof identityStepSchema>;
export type AboutStepData = z.infer<typeof aboutStepSchema>;
export type BioStepData = z.infer<typeof bioStepSchema>;
export type PersonalityStepData = z.infer<typeof personalityStepSchema>;
export type LanguagesStepData = z.infer<typeof languagesStepSchema>;
export type EditProfileData = z.infer<typeof editProfileSchema>;
