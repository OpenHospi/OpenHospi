import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

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
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "app.profile" });
  return { title: t("title") };
}

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function ProfilePage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const { user } = await requireSession(locale);

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
