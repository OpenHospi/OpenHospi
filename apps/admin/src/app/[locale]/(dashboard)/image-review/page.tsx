import type { Locale } from "@openhospi/i18n";
import { ImageOff } from "lucide-react";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { Main } from "@/components/main";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { routing } from "@/i18n/routing";

import { getFlaggedPhotos, getReviewStats } from "./actions";
import { ImageReviewTable } from "./image-review-table";

type Props = {
  params: Promise<{ locale: Locale }>;
};

export default async function ImageReviewPage({ params }: Props) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) return null;
  setRequestLocale(locale);

  const t = await getTranslations({ locale, namespace: "admin" });
  const [photos, stats] = await Promise.all([getFlaggedPhotos(), getReviewStats()]);

  return (
    <Main className="gap-4 sm:gap-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">{t("imageReview.title")}</h2>
        <p className="text-muted-foreground">{t("imageReview.description")}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t("imageReview.stats.pending")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{stats.pendingCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t("imageReview.stats.reviewedToday")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{stats.reviewedTodayCount}</p>
          </CardContent>
        </Card>
      </div>

      {photos.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-4 py-16 text-center">
          <div className="rounded-full bg-muted p-4">
            <ImageOff className="size-8 text-muted-foreground" />
          </div>
          <div>
            <h3 className="text-lg font-semibold">{t("imageReview.emptyState")}</h3>
            <p className="text-sm text-muted-foreground">{t("imageReview.emptyDescription")}</p>
          </div>
        </div>
      ) : (
        <div className="-mx-4 flex-1 overflow-auto px-4 py-1">
          <ImageReviewTable data={photos} />
        </div>
      )}
    </Main>
  );
}
