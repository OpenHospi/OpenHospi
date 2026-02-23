"use client";

import logo from "@openhospi/shared/assets/logo.svg";
import { APP_NAME } from "@openhospi/shared/constants";
import { Menu } from "lucide-react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Link } from "@/i18n/navigation";

import { LanguageSwitcher } from "./language-switcher";

const navLinks = [
  { href: "/how-it-works", key: "howItWorks" },
  { href: "/for-houses", key: "forHouses" },
  { href: "/safety", key: "safety" },
  { href: "/costs", key: "costs" },
  { href: "/about", key: "about" },
] as const;

export function MarketingHeader() {
  const t = useTranslations("header");
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <nav
        className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8"
        aria-label="Main navigation"
      >
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 font-bold text-xl">
          <Image src={logo} alt="" width={24} height={24} className="size-6" />
          <span className="text-primary">{APP_NAME}</span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden items-center gap-1 md:flex">
          {navLinks.map(({ href, key }) => (
            <Button key={key} variant="ghost" size="sm" asChild>
              <Link href={href}>{t(`nav.${key}`)}</Link>
            </Button>
          ))}
        </div>

        {/* Desktop actions */}
        <div className="hidden items-center gap-2 md:flex">
          <LanguageSwitcher />
          <ThemeToggle />
          <Button asChild size="sm">
            <Link href="/api/auth/signin">{t("login")}</Link>
          </Button>
        </div>

        {/* Mobile menu */}
        <div className="flex items-center gap-2 md:hidden">
          <LanguageSwitcher />
          <ThemeToggle />
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" aria-label={t("menuOpen")}>
                <Menu className="size-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right">
              <SheetHeader>
                <SheetTitle className="text-primary">{APP_NAME}</SheetTitle>
              </SheetHeader>
              <div className="flex flex-col gap-1 p-4">
                {navLinks.map(({ href, key }) => (
                  <Button
                    key={key}
                    variant="ghost"
                    className="justify-start"
                    asChild
                    onClick={() => setOpen(false)}
                  >
                    <Link href={href}>{t(`nav.${key}`)}</Link>
                  </Button>
                ))}
                <div className="mt-4">
                  <Button className="w-full" asChild>
                    <Link href="/api/auth/signin">{t("login")}</Link>
                  </Button>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </nav>
    </header>
  );
}
