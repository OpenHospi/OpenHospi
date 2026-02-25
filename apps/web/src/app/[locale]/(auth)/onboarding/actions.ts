"use server";

import { withRLS } from "@openhospi/database";
import { profiles } from "@openhospi/database/schema";
import {
  aboutStepSchema,
  personalityStepSchema,
  preferencesStepSchema,
  type AboutStepData,
  type PersonalityStepData,
  type PreferencesStepData,
} from "@openhospi/database/validators";
import { eq } from "drizzle-orm";

import { redirect } from "@/i18n/navigation";
import { requireSession } from "@/lib/auth-server";

export async function saveAboutStep(data: AboutStepData) {
  const session = await requireSession("nl");
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
  const session = await requireSession("nl");
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

export async function savePreferencesStep(data: PreferencesStepData) {
  const session = await requireSession("nl");
  const parsed = preferencesStepSchema.safeParse(data);
  if (!parsed.success) return { error: "Invalid data" };

  const { preferredCity, maxRent, availableFrom, vereniging, instagramHandle, showInstagram } =
    parsed.data;

  await withRLS(session.user.id, (tx) =>
    tx
      .update(profiles)
      .set({
        preferredCity,
        maxRent: maxRent != null ? String(maxRent) : null,
        availableFrom,
        vereniging: vereniging || null,
        instagramHandle: instagramHandle || null,
        showInstagram,
      })
      .where(eq(profiles.id, session.user.id)),
  );

  return { success: true };
}

export async function finishOnboarding() {
  const session = await requireSession("nl");
  if (!session) return;
  redirect({ href: "/discover", locale: "nl" });
}
