"use server";

import { db, withRLS } from "@openhospi/database";
import { profiles, user as userTable } from "@openhospi/database/schema";
import {
  aboutStepSchema,
  identityStepSchema,
  languagesStepSchema,
  personalityStepSchema,
  preferencesStepSchema,
  type AboutStepData,
  type IdentityStepData,
  type LanguagesStepData,
  type PersonalityStepData,
  type PreferencesStepData,
} from "@openhospi/database/validators";
import type { Locale } from "@openhospi/i18n";
import { eq } from "drizzle-orm";
import { getLocale } from "next-intl/server";

import { redirect } from "@/i18n/navigation-app";
import { auth } from "@/lib/auth";
import { requireSession } from "@/lib/auth-server";

export async function saveIdentityStep(data: IdentityStepData) {
  const session = await requireSession();
  const parsed = identityStepSchema.safeParse(data);
  if (!parsed.success) return { error: "invalidData" as const };

  const { firstName, lastName, email } = parsed.data;

  await withRLS(session.user.id, (tx) =>
    tx.update(profiles).set({ firstName, lastName, email }).where(eq(profiles.id, session.user.id)),
  );

  // Update Better Auth user email so verification works
  await db
    .update(userTable)
    .set({ email, emailVerified: false })
    .where(eq(userTable.id, session.user.id));

  // Trigger email verification
  await auth.api.sendVerificationEmail({
    body: { email, callbackURL: "/" },
  });

  return { success: true };
}

export async function saveAboutStep(data: AboutStepData) {
  const session = await requireSession();
  const parsed = aboutStepSchema.safeParse(data);
  if (!parsed.success) return { error: "invalidData" as const };

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
  if (!parsed.success) return { error: "invalidData" as const };

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
  if (!parsed.success) return { error: "invalidData" as const };

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
  if (!parsed.success) return { error: "invalidData" as const };

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
  await requireSession();
  const locale = (await getLocale()) as Locale;
  redirect({ href: "/discover", locale });
}
