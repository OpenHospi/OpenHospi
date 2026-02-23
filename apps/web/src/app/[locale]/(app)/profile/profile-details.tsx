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
          {profile.study_program && (
            <div>
              <span className="text-muted-foreground">{t("studyProgram")}</span>
              <p>{profile.study_program}</p>
            </div>
          )}
          {profile.study_level && (
            <div>
              <span className="text-muted-foreground">{t("studyLevel")}</span>
              <p>{tEnums(`study_level.${profile.study_level}`)}</p>
            </div>
          )}
          {profile.gender && (
            <div>
              <span className="text-muted-foreground">{t("gender")}</span>
              <p>{tEnums(`gender.${profile.gender}`)}</p>
            </div>
          )}
          {profile.birth_date && (
            <div>
              <span className="text-muted-foreground">{t("birthDate")}</span>
              <p>{profile.birth_date}</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("preferences")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          {profile.preferred_city && (
            <div>
              <span className="text-muted-foreground">{t("preferredCity")}</span>
              <p>{tEnums(`city.${profile.preferred_city}`)}</p>
            </div>
          )}
          {profile.max_rent && (
            <div>
              <span className="text-muted-foreground">{t("maxRent")}</span>
              <p>&euro;{profile.max_rent}/mo</p>
            </div>
          )}
          {profile.available_from && (
            <div>
              <span className="text-muted-foreground">{t("availableFrom")}</span>
              <p>{profile.available_from}</p>
            </div>
          )}
          {profile.show_instagram && profile.instagram_handle && (
            <div>
              <span className="text-muted-foreground">Instagram</span>
              <p>@{profile.instagram_handle}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {profile.lifestyle_tags && profile.lifestyle_tags.length > 0 && (
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">{t("lifestyleTags")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {profile.lifestyle_tags.map((tag) => (
                <Badge key={tag} variant="secondary">
                  {tEnums(`lifestyle_tag.${tag}`)}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
