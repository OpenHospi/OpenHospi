import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { redirect } from "@/i18n/navigation";
import { requireSession } from "@/lib/auth-server";
import { getProfile, isProfileComplete, type ProfileWithPhotos } from "@/lib/profile";

import { OnboardingForm } from "./onboarding-form";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "app.onboarding" });
  return { title: t("title") };
}

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function OnboardingPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const { user } = await requireSession(locale);

  const profile = await getProfile(user.id);

  if (profile && isProfileComplete(profile)) {
    redirect({ href: "/discover", locale });
  }

  const initialData: Partial<ProfileWithPhotos> = {
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
    instagramHandle: profile?.instagramHandle,
    showInstagram: profile?.showInstagram ?? false,
    photos: profile?.photos ?? [],
  };

  return <OnboardingForm initialData={initialData} />;
}
