import { SiGithub } from "@icons-pack/react-simple-icons";
import type { Locale } from "@openhospi/i18n";
import { Eye, Linkedin, Mail, Target } from "lucide-react";
import type { Metadata } from "next";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { routing } from "@/i18n/routing";
import { alternatesForPath, breadcrumbJsonLd } from "@/lib/marketing/seo";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) return {};
  const t = await getTranslations({ locale, namespace: "seo" });
  return {
    title: t("about.title"),
    description: t("about.description"),
    alternates: alternatesForPath(locale, "/about"),
  };
}

interface TeamMember {
  name: string;
  role: string;
  bio: string;
}

interface Social {
  type: "linkedin" | "github" | "email";
  url: string;
}

const teamData: { photo: string; initials: string; socials: Social[] }[] = [
  {
    photo: "/team/ruben.webp",
    initials: "RT",
    socials: [
      { type: "linkedin", url: "https://www.linkedin.com/in/rubentalstra/" },
      { type: "github", url: "https://github.com/rubentalstra" },
      { type: "email", url: "mailto:ruben@openhospi.nl" },
    ],
  },
  { photo: "/team/placeholder.svg", initials: "SK", socials: [] },
  { photo: "/team/placeholder.svg", initials: "HB", socials: [] },
];

const socialIcons = {
  linkedin: { icon: Linkedin, label: "LinkedIn" },
  github: { icon: SiGithub, label: "GitHub" },
  email: { icon: Mail, label: null },
} as const;

export default async function AboutPage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) return null;
  setRequestLocale(locale);

  const t = await getTranslations({ locale, namespace: "about" });
  const tCommon = await getTranslations({ locale, namespace: "common.labels" });
  const tSeo = await getTranslations({ locale, namespace: "seo.breadcrumbs" });

  // Safe: all content from our i18n translations, not user input
  const breadcrumbs = breadcrumbJsonLd(locale, [
    { name: tSeo("home"), path: "" },
    { name: t("title"), path: "/about" },
  ]);

  const members = t.raw("team.members") as TeamMember[];

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: breadcrumbs }} />

      {/* Hero */}
      <section className="py-24">
        <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{t("title")}</h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">{t("subtitle")}</p>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="bg-muted/30 py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto grid max-w-4xl gap-8 sm:grid-cols-2">
            <Card>
              <CardContent className="pt-6">
                <div className="flex size-12 items-center justify-center rounded-xl bg-primary/10">
                  <Target className="size-6 text-primary" />
                </div>
                <h2 className="mt-4 text-xl font-bold">{t("mission.title")}</h2>
                <p className="mt-2 text-muted-foreground">{t("mission.description")}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex size-12 items-center justify-center rounded-xl bg-primary/10">
                  <Eye className="size-6 text-primary" />
                </div>
                <h2 className="mt-4 text-xl font-bold">{t("vision.title")}</h2>
                <p className="mt-2 text-muted-foreground">{t("vision.description")}</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Why OpenHospi */}
      <section className="py-24">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">{t("problem.title")}</h2>
          <div className="mt-6 space-y-4 text-muted-foreground">
            <p>{t("problem.description1")}</p>
            <p>{t("problem.description2")}</p>
          </div>
        </div>
      </section>

      {/* The Team */}
      <section className="bg-muted/30 py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-center text-2xl font-bold tracking-tight sm:text-3xl">
            {t("team.title")}
          </h2>
          <div className="mx-auto mt-12 grid max-w-4xl gap-8 sm:grid-cols-3">
            {members.map((member, i) => {
              const data = teamData[i];
              return (
                <Card key={member.name} className="text-center">
                  <CardContent className="flex flex-col items-center gap-4 pt-6">
                    <Avatar className="size-24">
                      <AvatarImage src={data.photo} alt={member.name} />
                      <AvatarFallback className="text-lg">{data.initials}</AvatarFallback>
                    </Avatar>
                    <div className="space-y-1">
                      <h3 className="text-lg font-bold">{member.name}</h3>
                      <Badge variant="secondary">{member.role}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{member.bio}</p>
                    {data.socials.length > 0 && (
                      <>
                        <Separator />
                        <TooltipProvider>
                          <div className="flex gap-1">
                            {data.socials.map((social) => {
                              const { icon: Icon, label: staticLabel } = socialIcons[social.type];
                              const label = staticLabel ?? tCommon("email");
                              const isEmail = social.type === "email";
                              return (
                                <Tooltip key={social.type}>
                                  <TooltipTrigger asChild>
                                    <Button variant="ghost" size="icon" className="size-9" asChild>
                                      <a
                                        href={social.url}
                                        aria-label={label}
                                        {...(!isEmail && {
                                          target: "_blank",
                                          rel: "noopener noreferrer",
                                        })}
                                      >
                                        <Icon className="size-4" />
                                      </a>
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>{label}</TooltipContent>
                                </Tooltip>
                              );
                            })}
                          </div>
                        </TooltipProvider>
                      </>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Open Source & Community */}
      <section className="py-24">
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">{t("openSource.title")}</h2>
          <p className="mt-4 text-muted-foreground">{t("openSource.description")}</p>
          <div className="mt-8">
            <Button variant="outline" asChild>
              <a
                href="https://github.com/OpenHospi/OpenHospi"
                target="_blank"
                rel="noopener noreferrer"
              >
                <SiGithub className="size-4" color="currentColor" />
                {t("openSource.cta")}
              </a>
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}
