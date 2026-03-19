import { RootProvider } from "fumadocs-ui/provider/next";
import type { Metadata } from "next";
import { Inter } from "next/font/google";

import { i18nUI } from "@/lib/layout.shared";
import "../global.css";

const inter = Inter({
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "OpenHospi Docs",
    template: "%s — OpenHospi Docs",
  },
  description:
    "Documentation for OpenHospi — free, open-source student housing platform for the Netherlands.",
  metadataBase: new URL(
    process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : "http://localhost:3001",
  ),
  openGraph: {
    type: "website",
    siteName: "OpenHospi Docs",
  },
  twitter: {
    card: "summary",
  },
  icons: {
    icon: "/icon.svg",
    apple: "/apple-icon",
  },
};

export default async function RootLayout({
  params,
  children,
}: {
  params: Promise<{ lang: string }>;
  children: React.ReactNode;
}) {
  const lang = (await params).lang;

  return (
    <html lang={lang} className={inter.className} suppressHydrationWarning>
      <body className="flex min-h-screen flex-col">
        <RootProvider i18n={i18nUI.provider(lang)}>{children}</RootProvider>
      </body>
    </html>
  );
}
