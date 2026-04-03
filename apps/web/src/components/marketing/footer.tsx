"use client";

import { SiGithub, SiInstagram, SiOpencollective } from "@icons-pack/react-simple-icons";
import logo from "@openhospi/shared/assets/logo.svg";
import {
  APP_NAME,
  FOUNDATION_ADDRESS,
  FOUNDATION_EMAIL,
  FOUNDATION_NAME,
  KVK_NUMBER,
  RSIN_NUMBER,
} from "@openhospi/shared/constants";
import { LinkedinIcon } from "@openhospi/shared/icons";
import { Dot } from "lucide-react";
import Image from "next/image";
import { useTranslations } from "next-intl";

import { Link } from "@/i18n/navigation";

import { LanguageSwitcher } from "./language-switcher";
import { TrustpilotWidget } from "./trustpilot-widget";

export function MarketingFooter({ trustpilotScore = 0 }: { trustpilotScore?: number }) {
  const t = useTranslations("footer");

  const linkGroups = [
    {
      title: t("platform"),
      links: [
        { href: "/how-it-works", label: t("links.howItWorks") },
        { href: "/rooms", label: t("links.browseRooms") },
        { href: "/safety", label: t("links.safety") },
        { href: "/costs", label: t("links.costs") },
      ],
    },
    {
      title: t("legal"),
      links: [
        { href: "/privacy", label: t("links.privacy") },
        { href: "/cookies", label: t("links.cookies") },
        { href: "/terms", label: t("links.terms") },
        { href: "/anbi", label: t("links.anbi") },
      ],
    },
    {
      title: t("dataPrivacy"),
      links: [
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
        { href: "/faq", label: t("links.faq") },
        { href: "/alternatives", label: t("links.alternatives") },
        { href: "/missing-association", label: t("links.missingAssociation") },
      ],
    },
  ];

  return (
    <footer className="border-t bg-muted/30">
      {/* Band A: Main content */}
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-2 lg:grid-cols-6">
          {/* Branding column */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-2">
              <Image src={logo} alt="" width={24} height={24} className="size-6" />
              <p className="text-xl font-bold text-primary">{APP_NAME}</p>
            </div>

            <p className="mt-2 text-sm text-muted-foreground">{FOUNDATION_NAME}</p>

            {/* Uncomment when ANBI status is officially granted
            <div className="mt-1 flex items-center gap-1.5 text-sm font-medium text-primary">
              <ShieldCheck className="size-4" />
              <span>{t("anbiStatus")}</span>
            </div>
            */}

            <div className="mt-2 space-y-0.5 text-xs text-muted-foreground">
              <p className="flex items-center">
                KVK: {KVK_NUMBER}
                <Dot className="size-4" />
                RSIN: {RSIN_NUMBER}
              </p>
              <p>{FOUNDATION_ADDRESS}</p>
              <a
                href={`mailto:${FOUNDATION_EMAIL}`}
                className="transition-colors hover:text-foreground"
              >
                {FOUNDATION_EMAIL}
              </a>
            </div>

            <p className="mt-4 text-sm text-muted-foreground">{t("tagline")}</p>
            <p className="mt-1 text-xs text-muted-foreground">{t("license")}</p>

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
                      className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Band B: Bottom bar */}
      <div className="border-t">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 py-6 sm:flex-row sm:px-6 lg:px-8">
          <p className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} {FOUNDATION_NAME}. {t("rights")}
          </p>
          <div className="flex items-center gap-4">
            <TrustpilotWidget score={trustpilotScore} />
            <LanguageSwitcher />
          </div>
        </div>
      </div>
    </footer>
  );
}
