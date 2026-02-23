"use server";

import { redirect } from "@/i18n/navigation";
import { requireSession } from "@/lib/auth-server";
import { pool } from "@/lib/db";
import type {
  AboutStepData,
  PersonalityStepData,
  PreferencesStepData,
} from "@/lib/schemas/profile";
import {
  aboutStepSchema,
  personalityStepSchema,
  preferencesStepSchema,
} from "@/lib/schemas/profile";

export async function saveAboutStep(data: AboutStepData) {
  const session = await requireSession("nl");
  const parsed = aboutStepSchema.safeParse(data);
  if (!parsed.success) return { error: "Invalid data" };

  const { gender, birth_date, study_program, study_level, bio } = parsed.data;

  await pool.query(
    `UPDATE profiles SET gender = $1, birth_date = $2, study_program = $3, study_level = $4, bio = $5
     WHERE id = $6`,
    [gender, birth_date, study_program, study_level || null, bio || null, session.user.id],
  );

  return { success: true };
}

export async function savePersonalityStep(data: PersonalityStepData) {
  const session = await requireSession("nl");
  const parsed = personalityStepSchema.safeParse(data);
  if (!parsed.success) return { error: "Invalid data" };

  await pool.query("UPDATE profiles SET lifestyle_tags = $1 WHERE id = $2", [
    parsed.data.lifestyle_tags,
    session.user.id,
  ]);

  return { success: true };
}

export async function savePreferencesStep(data: PreferencesStepData) {
  const session = await requireSession("nl");
  const parsed = preferencesStepSchema.safeParse(data);
  if (!parsed.success) return { error: "Invalid data" };

  const { preferred_city, max_rent, available_from, vereniging, instagram_handle, show_instagram } =
    parsed.data;

  await pool.query(
    `UPDATE profiles SET
       preferred_city = $1, max_rent = $2, available_from = $3,
       vereniging = $4, instagram_handle = $5, show_instagram = $6
     WHERE id = $7`,
    [
      preferred_city,
      max_rent || null,
      available_from,
      vereniging || null,
      instagram_handle || null,
      show_instagram,
      session.user.id,
    ],
  );

  return { success: true };
}

export async function finishOnboarding() {
  const session = await requireSession("nl");
  if (!session) return;
  redirect({ href: "/discover", locale: "nl" });
}
