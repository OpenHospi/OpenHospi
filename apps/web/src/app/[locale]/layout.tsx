import type { WebMessages } from "@openhospi/i18n";
import { getMessages } from "@openhospi/i18n/web";
import { APP_NAME } from "@openhospi/shared/constants";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { notFound } from "next/navigation";
import { NextIntlClientProvider, hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { ConsentGatedAnalytics } from "@/components/shared/consent-gated-analytics";
import { CookieConsentBanner } from "@/components/shared/cookie-consent-banner";
import { ThemeProvider } from "@/components/shared/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { routing } from "@/i18n/routing";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) return {};
  const t = await getTranslations({ locale, namespace: "metadata" });
  return {
    metadataBase: new URL(process.env.NEXT_PUBLIC_MARKETING_URL ?? "https://openhospi.nl"),
    title: {
      template: `%s | ${APP_NAME}`,
      default: t("title"),
    },
    description: t("description"),
  };
}

type Props = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  setRequestLocale(locale);

  const messages = await getMessages(locale);

  return (
    <html lang={locale} suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <NextIntlClientProvider locale={locale} messages={messages as WebMessages}>
          <ThemeProvider>
            {children}
            <CookieConsentBanner />
            <Toaster />
          </ThemeProvider>
        </NextIntlClientProvider>
        <ConsentGatedAnalytics />
      </body>
    </html>
  );
}
