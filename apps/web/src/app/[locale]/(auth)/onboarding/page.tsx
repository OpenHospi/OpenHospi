import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { redirect } from "@/i18n/navigation";
import { requireSession } from "@/lib/auth-server";
import { getProfile, isProfileComplete, type Profile } from "@/lib/profile";

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

  const initialData: Partial<Profile> = {
    gender: profile?.gender,
    birth_date: profile?.birth_date,
    study_program: profile?.study_program,
    study_level: profile?.study_level,
    bio: profile?.bio,
    lifestyle_tags: profile?.lifestyle_tags,
    preferred_city: profile?.preferred_city,
    max_rent: profile?.max_rent,
    available_from: profile?.available_from,
    vereniging: profile?.vereniging,
    instagram_handle: profile?.instagram_handle,
    show_instagram: profile?.show_instagram ?? false,
    photos: profile?.photos ?? [],
  };

  return <OnboardingForm initialData={initialData} />;
}
