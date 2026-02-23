"use client";

import { Github, Heart, Home, Users } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";

const sectionConfig: {
  key: "mission" | "crisis" | "builtBy" | "openSource";
  icon: LucideIcon;
}[] = [
  { key: "mission", icon: Heart },
  { key: "crisis", icon: Home },
  { key: "builtBy", icon: Users },
  { key: "openSource", icon: Github },
];

export default function AboutPage() {
  const t = useTranslations("about");

  return (
    <section className="py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <h1 className="text-center text-3xl font-bold tracking-tight sm:text-4xl">{t("title")}</h1>

        <div className="mx-auto mt-16 max-w-3xl space-y-16">
          {sectionConfig.map(({ key, icon: Icon }) => (
            <div key={key}>
              <div className="flex items-center gap-3">
                <Icon className="size-6 text-primary" />
                <h2 className="text-2xl font-bold">{t(`${key}.title`)}</h2>
              </div>
              <p className="mt-4 text-muted-foreground">{t(`${key}.description`)}</p>
              {key === "openSource" && (
                <div className="mt-6">
                  <Button variant="outline" asChild>
                    <a
                      href="https://github.com/rubentalstra/OpenHospi"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Github className="size-4" />
                      {t("openSource.cta")}
                    </a>
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
