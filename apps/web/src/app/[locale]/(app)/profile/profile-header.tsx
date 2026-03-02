import { getInstitution } from "@openhospi/surfconext";
import { getTranslations } from "next-intl/server";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import type { ProfileWithPhotos } from "@/lib/profile";

type Props = {
  profile: ProfileWithPhotos;
};

export async function ProfileHeader({ profile }: Props) {
  const tEnums = await getTranslations("enums");
  const institution = getInstitution(profile.institutionDomain);

  const initials = `${profile.firstName[0] ?? ""}${profile.lastName[0] ?? ""}`
    .toUpperCase()
    .slice(0, 2);

  const primaryPhoto = profile.photos.find((p) => p.slot === 1);

  return (
    <div className="flex items-center gap-4">
      <Avatar size="lg">
        {primaryPhoto && <AvatarImage src={primaryPhoto.url} alt={profile.firstName} />}
        <AvatarFallback>{initials || "U"}</AvatarFallback>
      </Avatar>
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight">
          {profile.firstName} {profile.lastName}
        </h1>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary">{institution.short}</Badge>
          {profile.vereniging && (
            <Badge variant="outline">{tEnums(`vereniging.${profile.vereniging}` as any)}</Badge>
          )}
        </div>
      </div>
    </div>
  );
}
