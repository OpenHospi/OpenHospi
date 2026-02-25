import { CheckCircle2, Circle } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import type { ProfileWithPhotos } from "@/lib/profile";

type Props = {
  profile: ProfileWithPhotos;
};

export async function CompletenessCard({ profile }: Props) {
  const t = await getTranslations("app.profile");

  const fields = [
    { key: "photo", complete: profile.photos.length > 0 },
    { key: "bio", complete: !!profile.bio },
    { key: "studyProgram", complete: !!profile.studyProgram },
    { key: "birthDate", complete: !!profile.birthDate },
    { key: "preferredCity", complete: !!profile.preferredCity },
    { key: "lifestyleTags", complete: (profile.lifestyleTags?.length ?? 0) >= 2 },
    { key: "vereniging", complete: !!profile.vereniging },
  ];

  const completed = fields.filter((f) => f.complete).length;
  const total = fields.length;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{t("completeness.title", { completed, total })}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Progress value={(completed / total) * 100} />
        <ul className="grid gap-2 text-sm sm:grid-cols-2">
          {fields.map((field) => (
            <li key={field.key} className="flex items-center gap-2">
              {field.complete ? (
                <CheckCircle2 className="size-4 text-primary" />
              ) : (
                <Circle className="size-4 text-muted-foreground" />
              )}
              <span className={field.complete ? "" : "text-muted-foreground"}>
                {t(`completeness.${field.key}`)}
              </span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
