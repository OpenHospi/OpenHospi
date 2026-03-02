import { getTranslations } from "next-intl/server";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Profile } from "@/lib/profile";

type Props = {
  profile: Profile;
};

export async function ProfileDetails({ profile }: Props) {
  const t = await getTranslations("app.profile");
  const tEnums = await getTranslations("enums");

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {profile.bio && (
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">{t("bio")}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap text-sm text-muted-foreground">{profile.bio}</p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("studyInfo")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          {profile.studyProgram && (
            <div>
              <span className="text-muted-foreground">{t("studyProgram")}</span>
              <p>{profile.studyProgram}</p>
            </div>
          )}
          {profile.studyLevel && (
            <div>
              <span className="text-muted-foreground">{t("studyLevel")}</span>
              <p>{tEnums(`study_level.${profile.studyLevel}` as any)}</p>
            </div>
          )}
          {profile.gender && (
            <div>
              <span className="text-muted-foreground">{t("gender")}</span>
              <p>{tEnums(`gender.${profile.gender}` as any)}</p>
            </div>
          )}
          {profile.birthDate && (
            <div>
              <span className="text-muted-foreground">{t("birthDate")}</span>
              <p>{profile.birthDate}</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("preferences")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          {profile.preferredCity && (
            <div>
              <span className="text-muted-foreground">{t("preferredCity")}</span>
              <p>{tEnums(`city.${profile.preferredCity}` as any)}</p>
            </div>
          )}
          {profile.maxRent && (
            <div>
              <span className="text-muted-foreground">{t("maxRent")}</span>
              <p>&euro;{profile.maxRent}/mo</p>
            </div>
          )}
          {profile.availableFrom && (
            <div>
              <span className="text-muted-foreground">{t("availableFrom")}</span>
              <p>{profile.availableFrom}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {profile.lifestyleTags && profile.lifestyleTags.length > 0 && (
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">{t("lifestyleTags")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {profile.lifestyleTags.map((tag) => (
                <Badge key={tag} variant="secondary">
                  {tEnums(`lifestyle_tag.${tag}` as any)}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
