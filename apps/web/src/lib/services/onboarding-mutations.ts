import { createDrizzleSupabaseClient, db } from "@openhospi/database";
import {
  privateKeyBackups,
  profilePhotos,
  profiles,
  user as userTable,
  verification,
} from "@openhospi/database/schema";
import { EMAIL_CODE_LENGTH } from "@openhospi/shared/constants";
import { CommonError, OnboardingError } from "@openhospi/shared/error-codes";
import {
  aboutStepSchema,
  bioStepSchema,
  identityStepSchema,
  languagesStepSchema,
  personalityStepSchema,
  type AboutStepData,
  type BioStepData,
  type IdentityStepData,
  type LanguagesStepData,
  type PersonalityStepData,
} from "@openhospi/validators";
import { and, desc, eq, gt } from "drizzle-orm";

import { auth } from "@/lib/auth/auth";

const EMAIL_CODE_IDENTIFIER_PREFIX = "onboarding-email-code:";

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

export type OnboardingStatus = {
  emailVerified: boolean;
  hasIdentity: boolean;
  hasAbout: boolean;
  hasBio: boolean;
  hasPersonality: boolean;
  hasLanguages: boolean;
  hasPhotos: boolean;
  hasSecurity: boolean;
  isComplete: boolean;
  currentStep: number;
};

export async function getOnboardingStatus(userId: string): Promise<OnboardingStatus> {
  const emailVerified = await isEmailVerified(userId);

  const [profile] = await createDrizzleSupabaseClient(userId).rls((tx) =>
    tx
      .select({
        firstName: profiles.firstName,
        lastName: profiles.lastName,
        gender: profiles.gender,
        birthDate: profiles.birthDate,
        studyProgram: profiles.studyProgram,
        preferredCity: profiles.preferredCity,
        bio: profiles.bio,
        lifestyleTags: profiles.lifestyleTags,
        languages: profiles.languages,
      })
      .from(profiles)
      .where(eq(profiles.id, userId)),
  );

  const photos = await createDrizzleSupabaseClient(userId).rls((tx) =>
    tx
      .select({ id: profilePhotos.id })
      .from(profilePhotos)
      .where(eq(profilePhotos.userId, userId))
      .limit(1),
  );

  const keyBackup = await createDrizzleSupabaseClient(userId).rls((tx) =>
    tx
      .select({ userId: privateKeyBackups.userId })
      .from(privateKeyBackups)
      .where(eq(privateKeyBackups.userId, userId))
      .limit(1),
  );

  const hasIdentity = !!profile?.firstName && !!profile?.lastName && emailVerified;
  const hasAbout =
    profile?.gender !== null &&
    profile?.birthDate !== null &&
    profile?.studyProgram !== null &&
    profile?.preferredCity !== null;
  const hasBio = !!profile?.bio;
  const hasPersonality = (profile?.lifestyleTags?.length ?? 0) >= 2;
  const hasLanguages = (profile?.languages?.length ?? 0) >= 1;
  const hasPhotos = photos.length > 0;
  const hasSecurity = keyBackup.length > 0;

  const isComplete =
    hasIdentity && hasAbout && hasPersonality && hasLanguages && hasPhotos && hasSecurity;

  let currentStep = 1;
  if (hasIdentity) currentStep = 2;
  if (hasIdentity && hasAbout) currentStep = 3;
  if (hasIdentity && hasAbout) currentStep = 4;
  if (hasIdentity && hasAbout && hasPersonality) currentStep = 5;
  if (hasIdentity && hasAbout && hasPersonality && hasLanguages) currentStep = 6;
  if (hasIdentity && hasAbout && hasPersonality && hasLanguages && hasPhotos) currentStep = 7;
  if (isComplete) currentStep = 8; // complete

  return {
    emailVerified,
    hasIdentity,
    hasAbout,
    hasBio,
    hasPersonality,
    hasLanguages,
    hasPhotos,
    hasSecurity,
    isComplete,
    currentStep,
  };
}

export async function submitIdentityStep(userId: string, data: IdentityStepData) {
  const parsed = identityStepSchema.safeParse(data);
  if (!parsed.success) return { error: CommonError.invalid_data };

  const { firstName, lastName, email } = parsed.data;

  await createDrizzleSupabaseClient(userId).rls((tx) =>
    tx.update(profiles).set({ firstName, lastName, email }).where(eq(profiles.id, userId)),
  );

  await db.update(userTable).set({ email, emailVerified: false }).where(eq(userTable.id, userId));

  await auth.api.sendVerificationEmail({
    body: { email, callbackURL: "/" },
  });

  return { success: true as const, email };
}

export async function verifyEmailCodeForUser(
  userId: string,
  input: { email: string; code: string },
) {
  const email = input.email.trim();
  const code = normalizeCode(input.code);

  if (!email || code.length !== EMAIL_CODE_LENGTH) {
    return { error: OnboardingError.invalid_code };
  }

  const [latestCode] = await db
    .select({ value: verification.value })
    .from(verification)
    .where(
      and(
        eq(verification.identifier, emailCodeIdentifier(userId)),
        gt(verification.expiresAt, new Date()),
      ),
    )
    .orderBy(desc(verification.createdAt))
    .limit(1);

  if (!latestCode) {
    return { error: OnboardingError.code_expired };
  }

  let payload: { token?: string; code?: string; email?: string } = {};
  try {
    payload = JSON.parse(latestCode.value) as { token?: string; code?: string; email?: string };
  } catch {
    return { error: OnboardingError.invalid_code };
  }

  if (payload.email !== email) {
    return { error: OnboardingError.email_mismatch };
  }

  if (!payload.token || payload.code !== code) {
    return { error: OnboardingError.invalid_code };
  }

  await auth.api.verifyEmail({ query: { token: payload.token } });

  return { success: true as const };
}

export async function resendEmailCodeForUser(userId: string, input: { email: string }) {
  const email = input.email.trim();
  if (!email) return { error: CommonError.invalid_data };

  const [authUser] = await db
    .select({ email: userTable.email })
    .from(userTable)
    .where(eq(userTable.id, userId));

  if (!authUser || authUser.email !== email) {
    return { error: OnboardingError.email_mismatch };
  }

  await auth.api.sendVerificationEmail({
    body: { email, callbackURL: "/" },
  });

  return { success: true as const };
}

export async function submitAboutStep(userId: string, data: AboutStepData) {
  if (!(await isEmailVerified(userId))) return { error: OnboardingError.email_not_verified };

  const parsed = aboutStepSchema.safeParse(data);
  if (!parsed.success) return { error: CommonError.invalid_data };

  const { gender, birthDate, studyProgram, studyLevel, preferredCity, vereniging } = parsed.data;

  await createDrizzleSupabaseClient(userId).rls((tx) =>
    tx
      .update(profiles)
      .set({
        gender,
        birthDate,
        studyProgram,
        studyLevel: studyLevel || null,
        preferredCity,
        vereniging: vereniging || null,
      })
      .where(eq(profiles.id, userId)),
  );

  return { success: true };
}

export async function submitBioStep(userId: string, data: BioStepData) {
  if (!(await isEmailVerified(userId))) return { error: OnboardingError.email_not_verified };

  const parsed = bioStepSchema.safeParse(data);
  if (!parsed.success) return { error: CommonError.invalid_data };

  await createDrizzleSupabaseClient(userId).rls((tx) =>
    tx.update(profiles).set({ bio: parsed.data.bio }).where(eq(profiles.id, userId)),
  );

  return { success: true };
}

export async function submitPersonalityStep(userId: string, data: PersonalityStepData) {
  if (!(await isEmailVerified(userId))) return { error: OnboardingError.email_not_verified };

  const parsed = personalityStepSchema.safeParse(data);
  if (!parsed.success) return { error: CommonError.invalid_data };

  await createDrizzleSupabaseClient(userId).rls((tx) =>
    tx
      .update(profiles)
      .set({ lifestyleTags: parsed.data.lifestyleTags })
      .where(eq(profiles.id, userId)),
  );

  return { success: true };
}

export async function submitLanguagesStep(userId: string, data: LanguagesStepData) {
  if (!(await isEmailVerified(userId))) return { error: OnboardingError.email_not_verified };

  const parsed = languagesStepSchema.safeParse(data);
  if (!parsed.success) return { error: CommonError.invalid_data };

  await createDrizzleSupabaseClient(userId).rls((tx) =>
    tx.update(profiles).set({ languages: parsed.data.languages }).where(eq(profiles.id, userId)),
  );

  return { success: true };
}
