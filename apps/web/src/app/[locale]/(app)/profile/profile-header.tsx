import type { Locale } from "@openhospi/i18n";
import { getInstitution } from "@openhospi/inacademia";
import { getLocale, getTranslations } from "next-intl/server";

import { Badge } from "@/components/ui/badge";
import type { ProfileWithPhotos } from "@/lib/profile";

type Props = {
  profile: ProfileWithPhotos;
};

export async function ProfileHeader({ profile }: Props) {
  const tEnums = await getTranslations("enums");
  const locale = (await getLocale()) as Locale;
  const institution = getInstitution(profile.institutionDomain);
  const institutionName = locale === "nl" ? institution.name.nl : institution.name.en;

  return (
    <div className="space-y-1">
      <h1 className="text-2xl font-bold tracking-tight">
        {profile.firstName} {profile.lastName}
      </h1>
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="secondary" title={institutionName}>
          {institution.short}
        </Badge>
        {profile.vereniging && (
          <Badge variant="outline">{tEnums(`vereniging.${profile.vereniging}`)}</Badge>
        )}
      </div>
    </div>
  );
}
