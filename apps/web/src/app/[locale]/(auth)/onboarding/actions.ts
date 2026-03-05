"use server";

import { db, withRLS } from "@openhospi/database";
import { profiles, user as userTable, verification } from "@openhospi/database/schema";
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
import { and, desc, eq, gt } from "drizzle-orm";
import { getLocale } from "next-intl/server";

import { redirect } from "@/i18n/navigation-app";
import { auth } from "@/lib/auth";
import { requireSession } from "@/lib/auth-server";

const EMAIL_CODE_IDENTIFIER_PREFIX = "onboarding-email-code:";
const EMAIL_CODE_LENGTH = 6;

function emailCodeIdentifier(userId: string): string {
  return `${EMAIL_CODE_IDENTIFIER_PREFIX}${userId}`;
}

function normalizeCode(code: string): string {
  return code.replaceAll(/\D/g, "").slice(0, EMAIL_CODE_LENGTH);
}

async function isEmailVerified(userId: string): Promise<boolean> {
  const [authUser] = await db
    .select({ emailVerified: userTable.emailVerified })
    .from(userTable)
    .where(eq(userTable.id, userId));

  return authUser?.emailVerified ?? false;
}

export async function startEmailVerification(data: IdentityStepData) {
  const session = await requireSession();
  const parsed = identityStepSchema.safeParse(data);
  if (!parsed.success) return { error: "invalidData" as const };

  const { firstName, lastName, email } = parsed.data;

  await withRLS(session.user.id, (tx) =>
    tx.update(profiles).set({ firstName, lastName, email }).where(eq(profiles.id, session.user.id)),
  );

  await db
    .update(userTable)
    .set({ email, emailVerified: false })
    .where(eq(userTable.id, session.user.id));

  await auth.api.sendVerificationEmail({
    body: { email, callbackURL: "/" },
  });

  return { success: true as const, email };
}

export async function resendEmailCode(input: { email: string }) {
  const session = await requireSession();
  const email = input.email.trim();

  if (!email) return { error: "invalidData" as const };

  const [authUser] = await db
    .select({ email: userTable.email })
    .from(userTable)
    .where(eq(userTable.id, session.user.id));

  if (!authUser || authUser.email !== email) {
    return { error: "emailMismatch" as const };
  }

  await auth.api.sendVerificationEmail({
    body: { email, callbackURL: "/" },
  });

  return { success: true as const };
}

export async function verifyEmailCode(input: { email: string; code: string }) {
  const session = await requireSession();
  const email = input.email.trim();
  const code = normalizeCode(input.code);

  if (!email || code.length !== EMAIL_CODE_LENGTH) {
    return { error: "invalidCode" as const };
  }

  const [latestCode] = await db
    .select({ value: verification.value })
    .from(verification)
    .where(
      and(
        eq(verification.identifier, emailCodeIdentifier(session.user.id)),
        gt(verification.expiresAt, new Date()),
      ),
    )
    .orderBy(desc(verification.createdAt))
    .limit(1);

  if (!latestCode) {
    return { error: "codeExpired" as const };
  }

  let payload: { token?: string; code?: string; email?: string } = {};
  try {
    payload = JSON.parse(latestCode.value) as { token?: string; code?: string; email?: string };
  } catch {
    return { error: "invalidCode" as const };
  }

  if (payload.email !== email) {
    return { error: "emailMismatch" as const };
  }

  if (!payload.token || payload.code !== code) {
    return { error: "invalidCode" as const };
  }

  await auth.api.verifyEmail({ query: { token: payload.token } });

  return { success: true as const };
}

export async function saveAboutStep(data: AboutStepData) {
  const session = await requireSession();
  if (!(await isEmailVerified(session.user.id))) return { error: "emailNotVerified" as const };

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
  if (!(await isEmailVerified(session.user.id))) return { error: "emailNotVerified" as const };

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
  if (!(await isEmailVerified(session.user.id))) return { error: "emailNotVerified" as const };

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
  if (!(await isEmailVerified(session.user.id))) return { error: "emailNotVerified" as const };

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
  const session = await requireSession();
  const locale = (await getLocale()) as Locale;

  if (!(await isEmailVerified(session.user.id))) {
    redirect({ href: "/onboarding", locale });
  }

  redirect({ href: "/discover", locale });
}
