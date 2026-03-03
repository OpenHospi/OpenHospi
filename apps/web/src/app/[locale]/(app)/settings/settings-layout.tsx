"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";

import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

import { AccountSettings } from "./account-settings";
import { GeneralSettings } from "./general-settings";
import { PrivacySettings } from "./privacy-settings";

const sections = ["general", "privacy", "account"] as const;
type Section = (typeof sections)[number];

export function SettingsLayout() {
  const t = useTranslations("app.settings");
  const [active, setActive] = useState<Section>("general");

  return (
    <div className="-mx-4 flex h-full flex-1 flex-col gap-6 lg:flex-row">
      {/* Desktop: vertical nav */}
      <aside className="hidden w-48 shrink-0 lg:block">
        <nav className="flex flex-col gap-1">
          {sections.map((s) => (
            <button
              key={s}
              type="button"
              className={cn(
                "rounded-md px-3 py-2 text-left text-sm",
                active === s && "bg-accent font-medium",
              )}
              onClick={() => setActive(s)}
            >
              {t(`tabs.${s}`)}
            </button>
          ))}
        </nav>
      </aside>

      {/* Mobile: select dropdown */}
      <div className="px-4 lg:hidden">
        <Select value={active} onValueChange={(v) => setActive(v as Section)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {sections.map((s) => (
              <SelectItem key={s} value={s}>
                {t(`tabs.${s}`)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Content */}
      <ScrollArea className="flex-1">
        <div className="max-w-2xl space-y-6 px-4 pb-6 lg:pr-4">
          {active === "general" && <GeneralSettings />}
          {active === "privacy" && <PrivacySettings />}
          {active === "account" && <AccountSettings />}
        </div>
      </ScrollArea>
    </div>
  );
}
