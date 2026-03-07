"use client";

import type { Locale } from "@openhospi/i18n";
import { LOCALE_CONFIG } from "@openhospi/i18n";
import { Globe } from "lucide-react";
import { useLocale } from "next-intl";

import { updatePreferredLocale } from "@/app/[locale]/(app)/settings/actions";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { usePathname, useRouter } from "@/i18n/navigation-app";
import { appRouting } from "@/i18n/routing";

export function AppLanguageSwitcher() {
  const locale = useLocale() as Locale;
  const router = useRouter();
  const pathname = usePathname();

  function switchLocale(newLocale: Locale) {
    router.replace(pathname, { locale: newLocale });
    updatePreferredLocale(newLocale);
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" aria-label="Switch language">
          <Globe className="size-4" />
          {LOCALE_CONFIG[locale].label}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {appRouting.locales.map((loc) => (
          <DropdownMenuItem
            key={loc}
            onClick={() => switchLocale(loc)}
            className={loc === locale ? "bg-accent" : ""}
          >
            {LOCALE_CONFIG[loc].name}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
