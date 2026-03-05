import type { Locale } from "@openhospi/i18n";
import type { Metadata } from "next";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { Main } from "@/components/layout";
import { routing } from "@/i18n/routing";
import { requireSession } from "@/lib/auth-server";
import { getProfile } from "@/lib/profile";

import { PhotosGrid } from "./photos-grid";
import { ProfileHeader } from "./profile-header";
import {
  AboutCard,
  BioCard,
  LanguagesCard,
  LifestyleCard,
  PreferencesCard,
} from "./profile-section-dialogs";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) return {};
  const t = await getTranslations({ locale, namespace: "app.profile" });
  return { title: t("title") };
}

type Props = {
  params: Promise<{ locale: Locale }>;
};

export default async function ProfilePage({ params }: Props) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) return null;
  setRequestLocale(locale);
  const { user } = await requireSession();

  const profile = await getProfile(user.id);
  if (!profile) return null;

  return (
    <Main>
      <div className="space-y-8">
        <ProfileHeader profile={profile} />
        <PhotosGrid photos={profile.photos} editable />
        <BioCard profile={profile} />
        <div className="grid gap-6 md:grid-cols-2">
          <AboutCard profile={profile} />
          <PreferencesCard profile={profile} />
        </div>
        <LanguagesCard profile={profile} />
        <LifestyleCard profile={profile} />
      </div>
    </Main>
  );
}
