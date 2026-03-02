import type { Locale } from "@openhospi/i18n";
import type { Metadata } from "next";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { routing } from "@/i18n/routing";
import { requireSession } from "@/lib/auth-server";
import { getProfile } from "@/lib/profile";

import { CompletenessCard } from "./completeness-card";
import { EditProfileDialog } from "./edit-profile-dialog";
import { PhotosGrid } from "./photos-grid";
import { ProfileDetails } from "./profile-details";
import { ProfileHeader } from "./profile-header";

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
    <div className="space-y-8">
      <div className="flex items-start justify-between">
        <ProfileHeader profile={profile} />
        <EditProfileDialog profile={profile} />
      </div>

      <PhotosGrid photos={profile.photos} editable />

      <ProfileDetails profile={profile} />

      <CompletenessCard profile={profile} />
    </div>
  );
}
