"use server";

import type {
  AboutStepData,
  BioStepData,
  IdentityStepData,
  LanguagesStepData,
  PersonalityStepData,
} from "@openhospi/validators";
import type { Locale } from "@openhospi/i18n";
import { getLocale } from "next-intl/server";

import { redirect } from "@/i18n/navigation-app";
import { requireSession } from "@/lib/auth/server";
import {
  resendEmailCodeForUser,
  submitAboutStep,
  submitBioStep,
  submitIdentityStep,
  submitLanguagesStep,
  submitPersonalityStep,
  verifyEmailCodeForUser,
} from "@/lib/services/onboarding-mutations";

export async function startEmailVerification(data: IdentityStepData) {
  const session = await requireSession();
  return submitIdentityStep(session.user.id, data);
}

export async function resendEmailCode(input: { email: string }) {
  const session = await requireSession();
  return resendEmailCodeForUser(session.user.id, input);
}

export async function verifyEmailCode(input: { email: string; code: string }) {
  const session = await requireSession();
  return verifyEmailCodeForUser(session.user.id, input);
}

export async function saveAboutStep(data: AboutStepData) {
  const session = await requireSession();
  return submitAboutStep(session.user.id, data);
}

export async function saveBioStep(data: BioStepData) {
  const session = await requireSession();
  return submitBioStep(session.user.id, data);
}

export async function savePersonalityStep(data: PersonalityStepData) {
  const session = await requireSession();
  return submitPersonalityStep(session.user.id, data);
}

export async function saveLanguagesStep(data: LanguagesStepData) {
  const session = await requireSession();
  return submitLanguagesStep(session.user.id, data);
}

export async function finishOnboarding() {
  const locale = (await getLocale()) as Locale;
  redirect({ href: "/discover", locale });
}
