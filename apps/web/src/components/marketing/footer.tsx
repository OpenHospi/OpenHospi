"use client";

import { SiGithub, SiInstagram, SiOpencollective } from "@icons-pack/react-simple-icons";
import logo from "@openhospi/shared/assets/logo.svg";
import { APP_NAME } from "@openhospi/shared/constants";
import { LinkedinIcon } from "@openhospi/shared/icons";
import Image from "next/image";
import { useTranslations } from "next-intl";

import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Link } from "@/i18n/navigation";

import { LanguageSwitcher } from "./language-switcher";
import { TrustpilotWidget } from "./trustpilot-widget";

export function MarketingFooter({ trustpilotScore = 0 }: { trustpilotScore?: number }) {
  const t = useTranslations("footer");

  const linkGroups = [
    {
      title: t("product"),
      links: [
        { href: "/how-it-works", label: t("links.howItWorks") },
        { href: "/rooms", label: t("links.browseRooms") },
        { href: "/safety", label: t("links.safety") },
      ],
    },
    {
      title: t("legal"),
      links: [
        { href: "/privacy", label: t("links.privacy") },
        { href: "/cookies", label: t("links.cookies") },
        { href: "/terms", label: t("links.terms") },
        { href: "/processing-register", label: t("links.processingRegister") },
        { href: "/legal-basis", label: t("links.legalBasis") },
        { href: "/data-processors", label: t("links.dataProcessors") },
        { href: "/dpia", label: t("links.dpia") },
      ],
    },
    {
      title: t("community"),
      links: [
        { href: "/about", label: t("links.about") },
        { href: "/alternatives", label: t("links.alternatives") },
        { href: "/costs", label: t("links.costs") },
        { href: "/faq", label: t("links.faq") },
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
                href="https://github.com/OpenHospi/OpenHospi"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground transition-colors hover:text-[#181717] dark:hover:text-white"
                aria-label="GitHub"
              >
                <SiGithub className="size-5" color="currentColor" />
              </a>
              <Badge variant="outline" className="text-xs">
                {t("openSource")}
              </Badge>
              <a
                href="https://www.instagram.com/openhospi"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground transition-colors hover:text-[#FF0069]"
                aria-label="Instagram"
              >
                <SiInstagram className="size-5" color="currentColor" />
              </a>
              <a
                href="https://www.linkedin.com/company/openhospi"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground transition-colors hover:text-[#0A66C2]"
                aria-label="LinkedIn"
              >
                <LinkedinIcon className="size-5" />
              </a>
              <a
                href="https://opencollective.com/openhospi"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground transition-colors hover:text-[#7FADF2]"
                aria-label="Open Collective"
              >
                <SiOpencollective className="size-5" color="currentColor" />
              </a>
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
          <div className="flex flex-col items-center gap-1 sm:items-start">
            <p className="text-sm text-muted-foreground">
              &copy; {new Date().getFullYear()} {APP_NAME}. {t("rights")}
            </p>
            <a
              href="mailto:info@openhospi.nl"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              info@openhospi.nl
            </a>
          </div>
          <div className="flex items-center gap-4">
            <TrustpilotWidget score={trustpilotScore} />
            <LanguageSwitcher />
          </div>
        </div>
      </div>
    </footer>
  );
}
