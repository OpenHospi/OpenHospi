import type { Locale } from "@openhospi/i18n";
import type { Metadata } from "next";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { redirect } from "@/i18n/navigation-app";
import { routing } from "@/i18n/routing";
import { requireSession } from "@/lib/auth-server";
import {
  getProfile,
  hasEncryptionKeyBackup,
  isProfileComplete,
  type ProfileWithPhotos,
} from "@/lib/profile";

import { OnboardingForm } from "./onboarding-form";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) return {};
  const t = await getTranslations({ locale, namespace: "app.onboarding" });
  return { title: t("title") };
}

type Props = {
  params: Promise<{ locale: Locale }>;
};

export default async function OnboardingPage({ params }: Props) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) return null;
  setRequestLocale(locale);
  const { user } = await requireSession();

  const profile = await getProfile(user.id);

  if (profile && isProfileComplete(profile) && (await hasEncryptionKeyBackup(user.id))) {
    redirect({ href: "/discover", locale });
  }

  const initialData: Partial<ProfileWithPhotos> = {
    firstName: profile?.firstName,
    lastName: profile?.lastName,
    email: profile?.email,
    institutionDomain: profile?.institutionDomain,
    gender: profile?.gender,
    birthDate: profile?.birthDate,
    studyProgram: profile?.studyProgram,
    studyLevel: profile?.studyLevel,
    bio: profile?.bio,
    lifestyleTags: profile?.lifestyleTags,
    preferredCity: profile?.preferredCity,
    maxRent: profile?.maxRent,
    availableFrom: profile?.availableFrom,
    vereniging: profile?.vereniging,
    photos: profile?.photos ?? [],
  };

  return (
    <OnboardingForm initialData={initialData} userId={user.id} emailVerified={user.emailVerified} />
  );
}
