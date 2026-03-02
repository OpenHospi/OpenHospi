"use server";

import type { Locale } from "@openhospi/i18n";
import { withRLS } from "@openhospi/database";
import { profiles } from "@openhospi/database/schema";
import {
  aboutStepSchema,
  languagesStepSchema,
  personalityStepSchema,
  preferencesStepSchema,
  type AboutStepData,
  type LanguagesStepData,
  type PersonalityStepData,
  type PreferencesStepData,
} from "@openhospi/database/validators";
import { eq } from "drizzle-orm";
import { getLocale } from "next-intl/server";

import { redirect } from "@/i18n/navigation-app";
import { requireSession } from "@/lib/auth-server";

export async function saveAboutStep(data: AboutStepData) {
  const session = await requireSession();
  const parsed = aboutStepSchema.safeParse(data);
  if (!parsed.success) return { error: "Invalid data" };

  const { gender, birthDate, studyProgram, studyLevel, bio } = parsed.data;

  await withRLS(session.user.id, (tx) =>
    tx
      .update(profiles)
      .set({
        gender,
        birthDate,
        studyProgram,
        studyLevel: studyLevel || null,
        bio: bio || null,
      })
      .where(eq(profiles.id, session.user.id)),
  );

  return { success: true };
}

export async function savePersonalityStep(data: PersonalityStepData) {
  const session = await requireSession();
  const parsed = personalityStepSchema.safeParse(data);
  if (!parsed.success) return { error: "Invalid data" };

  await withRLS(session.user.id, (tx) =>
    tx
      .update(profiles)
      .set({ lifestyleTags: parsed.data.lifestyleTags })
      .where(eq(profiles.id, session.user.id)),
  );

  return { success: true };
}

export async function saveLanguagesStep(data: LanguagesStepData) {
  const session = await requireSession();
  const parsed = languagesStepSchema.safeParse(data);
  if (!parsed.success) return { error: "Invalid data" };

  await withRLS(session.user.id, (tx) =>
    tx
      .update(profiles)
      .set({ languages: parsed.data.languages })
      .where(eq(profiles.id, session.user.id)),
  );

  return { success: true };
}

export async function savePreferencesStep(data: PreferencesStepData) {
  const session = await requireSession();
  const parsed = preferencesStepSchema.safeParse(data);
  if (!parsed.success) return { error: "Invalid data" };

  const { preferredCity, maxRent, availableFrom, vereniging } = parsed.data;

  await withRLS(session.user.id, (tx) =>
    tx
      .update(profiles)
      .set({
        preferredCity,
        maxRent: maxRent != null ? String(maxRent) : null,
        availableFrom,
        vereniging: vereniging || null,
      })
      .where(eq(profiles.id, session.user.id)),
  );

  return { success: true };
}

export async function finishOnboarding() {
  const session = await requireSession();
  if (!session) return;
  const locale = (await getLocale()) as Locale;
  redirect({ href: "/discover", locale });
}
