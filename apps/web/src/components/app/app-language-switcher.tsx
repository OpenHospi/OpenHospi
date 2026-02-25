"use client";

import { Globe } from "lucide-react";
import { useLocale } from "next-intl";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { usePathname, useRouter } from "@/i18n/navigation-app";
import { appRouting } from "@/i18n/routing";

const localeLabels: Record<string, string> = {
  nl: "NL",
  en: "EN",
  de: "DE",
};

const localeNames: Record<string, string> = {
  nl: "Nederlands",
  en: "English",
  de: "Deutsch",
};

export function AppLanguageSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  function switchLocale(newLocale: string) {
    router.replace(pathname, { locale: newLocale as "nl" | "en" | "de" });
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" aria-label="Switch language">
          <Globe className="size-4" />
          {localeLabels[locale]}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {appRouting.locales.map((loc) => (
          <DropdownMenuItem
            key={loc}
            onClick={() => switchLocale(loc)}
            className={loc === locale ? "bg-accent" : ""}
          >
            {localeNames[loc]}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
