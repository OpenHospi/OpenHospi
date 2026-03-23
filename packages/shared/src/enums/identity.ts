import { defineEnum } from "./utils/define-enum";

export const Gender = defineEnum(["male", "female", "prefer_not_to_say"] as const);
export type Gender = (typeof Gender.values)[number];

export const GenderPreference = defineEnum(["male", "female", "no_preference"] as const);
export type GenderPreference = (typeof GenderPreference.values)[number];

export const Language = defineEnum([
  "nl",
  "en",
  "de",
  "fr",
  "es",
  "it",
  "pt",
  "zh",
  "ar",
  "tr",
  "pl",
  "hi",
  "ja",
  "ko",
] as const);
export type Language = (typeof Language.values)[number];

export const StudyLevel = defineEnum([
  "mbo",
  "hbo_propedeuse",
  "hbo_bachelor",
  "wo_propedeuse",
  "wo_bachelor",
  "pre_master",
  "master",
  "phd",
] as const);
export type StudyLevel = (typeof StudyLevel.values)[number];

export const LifestyleTag = defineEnum([
  // Social vibe
  "sociable",
  "quiet",
  "introvert",
  "extrovert",
  // Activities
  "sports",
  "cooking",
  "gaming",
  "music",
  "nightlife",
  "partying",
  "studying",
  "reading",
  "traveling",
  "movie_night",
  "creative",
  // Living rhythm
  "early_bird",
  "night_owl",
  // Household
  "tidy",
  "relaxed_cleaning",
  // Diet & lifestyle
  "vegetarian",
  "vegan",
  "sustainable",
  // Social values
  "inclusive",
  "international",
  "pets",
] as const);
export type LifestyleTag = (typeof LifestyleTag.values)[number];
