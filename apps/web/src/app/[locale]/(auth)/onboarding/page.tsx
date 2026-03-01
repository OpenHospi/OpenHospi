import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";

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
  const { user } = await requireSession();

  const profile = await getProfile(user.id);

  if (profile && isProfileComplete(profile)) {
    redirect("/discover");
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
    photos: profile?.photos ?? [],
  };

  return <OnboardingForm initialData={initialData} />;
}
