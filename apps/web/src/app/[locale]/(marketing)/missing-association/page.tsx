import { Mail } from "lucide-react";
import type { Metadata } from "next";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { routing } from "@/i18n/routing";
import { alternatesForPath, breadcrumbJsonLd } from "@/lib/seo";

import { CopyButton } from "./_components/copy-button";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) return {};
  const t = await getTranslations({ locale, namespace: "seo" });
  return {
    title: t("missingAssociation.title"),
    description: t("missingAssociation.description"),
    alternates: alternatesForPath(locale, "/missing-association"),
  };
}

export default async function MissingAssociationPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) return null;
  setRequestLocale(locale);

  const t = await getTranslations({ locale, namespace: "missingAssociation" });
  const tSeo = await getTranslations({ locale, namespace: "seo.breadcrumbs" });

  const emailTo = "me@rubentalstra.nl";
  const subject = t("emailSubject");
  const body = t("emailBody");

  // Safe: JSON-LD from i18n translations, sanitized in seo.ts (per Next.js docs recommendation)
  const breadcrumbs = breadcrumbJsonLd(locale, [
    { name: tSeo("home"), path: "" },
    { name: t("title"), path: "/missing-association" },
  ]);

  return (
    <section className="py-24">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: breadcrumbs }} />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <Mail className="mx-auto size-12 text-primary" />
          <h1 className="mt-6 text-3xl font-bold tracking-tight sm:text-4xl">{t("title")}</h1>
          <p className="mt-4 text-lg text-muted-foreground">{t("description")}</p>
        </div>

        <Card className="mx-auto mt-12 max-w-lg">
          <CardHeader>
            <CardTitle className="text-base">{t("cardTitle")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground">{t("labels.to")}</p>
              <div className="flex items-center justify-between rounded-md border bg-muted/50 px-3 py-2">
                <code className="text-sm">{emailTo}</code>
                <CopyButton text={emailTo} />
              </div>
            </div>

            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground">{t("labels.subject")}</p>
              <div className="flex items-center justify-between rounded-md border bg-muted/50 px-3 py-2">
                <span className="text-sm">{subject}</span>
                <CopyButton text={subject} />
              </div>
            </div>

            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground">{t("labels.body")}</p>
              <div className="flex items-start justify-between rounded-md border bg-muted/50 px-3 py-2">
                <pre className="whitespace-pre-wrap text-sm">{body}</pre>
                <CopyButton text={body} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
