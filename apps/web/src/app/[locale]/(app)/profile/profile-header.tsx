import { getInstitution } from "@openhospi/surfconext";
import { getTranslations } from "next-intl/server";

import { Badge } from "@/components/ui/badge";
import type { ProfileWithPhotos } from "@/lib/profile";

type Props = {
  profile: ProfileWithPhotos;
};

export async function ProfileHeader({ profile }: Props) {
  const tEnums = await getTranslations("enums");
  const institution = getInstitution(profile.institutionDomain);

  return (
    <div className="space-y-1">
      <h1 className="text-2xl font-bold tracking-tight">
        {profile.firstName} {profile.lastName}
      </h1>
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="secondary">{institution.short}</Badge>
        {profile.vereniging && (
          <Badge variant="outline">{tEnums(`vereniging.${profile.vereniging}`)}</Badge>
        )}
      </div>
    </div>
  );
}
