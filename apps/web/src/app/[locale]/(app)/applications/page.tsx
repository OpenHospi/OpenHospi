import type { Locale } from "@openhospi/i18n";
import { Search } from "lucide-react";
import type { Metadata } from "next";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { Main } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation-app";
import { routing } from "@/i18n/routing";
import { getUserApplications } from "@/lib/applications";
import { requireSession } from "@/lib/auth-server";

import { ApplicationCard } from "./application-card";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) return {};
  const t = await getTranslations({ locale, namespace: "app.applications" });
  return { title: t("title") };
}

type Props = {
  params: Promise<{ locale: Locale }>;
};

export default async function ApplicationsPage({ params }: Props) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) return null;
  setRequestLocale(locale);
  const { user } = await requireSession();

  const applications = await getUserApplications(user.id);
  const t = await getTranslations({ locale, namespace: "app.applications" });

  return (
    <Main fixed className="overflow-auto">
      <div className="space-y-6">
        <h2 className="text-2xl font-bold tracking-tight">{t("title")}</h2>

        {applications.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center">
            <p className="text-muted-foreground">{t("empty")}</p>
            <Button asChild className="mt-4">
              <Link href="/discover">
                <Search className="size-4" />
                {t("discoverRooms")}
              </Link>
            </Button>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {applications.map((app) => (
              <ApplicationCard key={app.id} application={app} />
            ))}
          </div>
        )}
      </div>
    </Main>
  );
}
