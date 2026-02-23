"use client";

import logo from "@openhospi/shared/assets/logo.svg";
import { APP_NAME } from "@openhospi/shared/constants";
import { Github } from "lucide-react";
import Image from "next/image";
import { useTranslations } from "next-intl";

import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Link } from "@/i18n/navigation";

import { LanguageSwitcher } from "./language-switcher";

export function MarketingFooter() {
  const t = useTranslations("footer");

  const linkGroups = [
    {
      title: t("product"),
      links: [
        { href: "/find-a-room", label: t("links.findRoom") },
        { href: "/list-a-room", label: t("links.listRoom") },
        { href: "/safety", label: t("links.safety") },
      ],
    },
    {
      title: t("legal"),
      links: [
        { href: "/privacy", label: t("links.privacy") },
        { href: "/terms", label: t("links.terms") },
      ],
    },
    {
      title: t("community"),
      links: [
        { href: "/about", label: t("links.about") },
        { href: "/costs", label: t("links.costs") },
        { href: "/missing-association", label: t("links.missingAssociation") },
      ],
    },
  ];

  return (
    <footer className="border-t bg-muted/30">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          {/* Branding */}
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2">
              <Image src={logo} alt="" width={24} height={24} className="size-6" />
              <p className="text-xl font-bold text-primary">{APP_NAME}</p>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">{t("tagline")}</p>
            <div className="mt-4 flex items-center gap-3">
              <a
                href="https://github.com/rubentalstra/OpenHospi"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-foreground transition-colors"
                aria-label="GitHub"
              >
                <Github className="size-5" />
              </a>
              <Badge variant="outline" className="text-xs">
                {t("openSource")}
              </Badge>
            </div>
          </div>

          {/* Link groups */}
          {linkGroups.map((group) => (
            <div key={group.title}>
              <h3 className="text-sm font-semibold">{group.title}</h3>
              <ul className="mt-3 space-y-2">
                {group.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <Separator className="my-8" />

        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
          <p className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} {APP_NAME}. {t("rights")}
          </p>
          <LanguageSwitcher />
        </div>
      </div>
    </footer>
  );
}
