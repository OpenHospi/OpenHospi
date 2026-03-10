import type { Locale } from "@openhospi/i18n";
import {
  ArrowLeftRight,
  Check,
  Code,
  Eye,
  EyeOff,
  Fingerprint,
  Key,
  Lock,
  RefreshCw,
  Shield,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { Metadata } from "next";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { MermaidDiagram } from "@/components/marketing/mermaid-diagram";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { alternatesForPath, breadcrumbJsonLd, faqJsonLd } from "@/lib/marketing/seo";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) return {};
  const t = await getTranslations({ locale, namespace: "seo" });
  return {
    title: t("e2eEncryption.title"),
    description: t("e2eEncryption.description"),
    alternates: alternatesForPath(locale, "/e2e-encryption"),
  };
}

const X3DH_CHART = `sequenceDiagram
    participant A as Alice (Sender)
    participant S as Server
    participant B as Bob (Recipient)
    B->>S: Upload identity key, signed pre-key, one-time pre-keys
    A->>S: Request Bob's key bundle
    S->>A: Return Bob's public keys
    Note over A: Compute shared secret using<br/>3 Diffie-Hellman exchanges
    A->>S: Send initial message + ephemeral key
    S->>B: Deliver message
    Note over B: Derive same shared secret<br/>from Alice's keys`;

const DOUBLE_RATCHET_CHART = `sequenceDiagram
    participant A as Alice
    participant B as Bob
    Note over A,B: Session established via X3DH
    A->>B: Message 1 (key₁)
    A->>B: Message 2 (key₂)
    B->>A: Message 3 (key₃) + new ratchet key
    Note over A,B: Both sides ratchet forward
    A->>B: Message 4 (key₄)
    Note over A,B: Old keys permanently deleted<br/>Past messages stay safe`;

interface SectionProps {
  icon: LucideIcon;
  title: string;
  description: string;
  children?: React.ReactNode;
}

function Section({ icon: Icon, title, description, children }: SectionProps) {
  return (
    <div className="mt-16">
      <div className="flex items-start gap-4">
        <div className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-primary/10">
          <Icon className="size-6 text-primary" />
        </div>
        <div>
          <h2 className="text-2xl font-bold tracking-tight">{title}</h2>
          <p className="mt-2 text-muted-foreground">{description}</p>
        </div>
      </div>
      {children}
    </div>
  );
}

export default async function E2eEncryptionPage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) return null;
  setRequestLocale(locale);

  const t = await getTranslations({ locale, namespace: "e2eEncryption" });
  const tSeo = await getTranslations({ locale, namespace: "seo" });

  // Safe: all content from our i18n translations, not user input
  const breadcrumbs = breadcrumbJsonLd(locale, [
    { name: tSeo("breadcrumbs.home"), path: "" },
    { name: tSeo("breadcrumbs.e2eEncryption"), path: "/e2e-encryption" },
  ]);

  const faqItems = tSeo.raw("faq.e2eEncryption") as { question: string; answer: string }[];
  // Safe: JSON-LD from i18n translations, sanitized in seo.ts (per Next.js docs recommendation)
  const faq = faqJsonLd(faqItems);

  return (
    <section className="py-24">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: breadcrumbs }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: faq }} />

      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        {/* Hero */}
        <div className="mx-auto max-w-2xl text-center">
          <div className="mx-auto mb-6 flex size-16 items-center justify-center rounded-full bg-primary/10">
            <Shield className="size-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{t("title")}</h1>
          <p className="mt-4 text-lg text-muted-foreground">{t("subtitle")}</p>
        </div>

        {/* Overview */}
        <Section icon={Lock} title={t("overview.title")} description={t("overview.description")} />

        {/* Identity Keys */}
        <Section
          icon={Fingerprint}
          title={t("identityKeys.title")}
          description={t("identityKeys.description")}
        >
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <Card className="border-0 bg-muted/50 shadow-none">
              <CardContent className="pt-6">
                <div className="mb-2 flex items-center gap-2">
                  <Key className="size-4 text-primary" />
                  <h3 className="font-semibold">Ed25519</h3>
                </div>
                <p className="text-sm text-muted-foreground">
                  Digital signatures for identity verification and key authentication.
                </p>
              </CardContent>
            </Card>
            <Card className="border-0 bg-muted/50 shadow-none">
              <CardContent className="pt-6">
                <div className="mb-2 flex items-center gap-2">
                  <ArrowLeftRight className="size-4 text-primary" />
                  <h3 className="font-semibold">X25519</h3>
                </div>
                <p className="text-sm text-muted-foreground">
                  Elliptic-curve Diffie-Hellman for secure key agreement between users.
                </p>
              </CardContent>
            </Card>
          </div>
        </Section>

        {/* Key Exchange (X3DH) */}
        <Section
          icon={ArrowLeftRight}
          title={t("keyExchange.title")}
          description={t("keyExchange.description")}
        >
          <div className="mt-6 rounded-lg border bg-muted/30 p-4">
            <MermaidDiagram chart={X3DH_CHART} />
          </div>
        </Section>

        {/* Double Ratchet */}
        <Section
          icon={RefreshCw}
          title={t("doubleRatchet.title")}
          description={t("doubleRatchet.description")}
        >
          <div className="mt-6 rounded-lg border bg-muted/30 p-4">
            <MermaidDiagram chart={DOUBLE_RATCHET_CHART} />
          </div>
        </Section>

        {/* Message Encryption */}
        <Section
          icon={Lock}
          title={t("messageEncryption.title")}
          description={t("messageEncryption.description")}
        >
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            {(
              [
                { label: "AES-256-GCM", detail: "Authenticated encryption" },
                { label: "Unique IV", detail: "Per-message randomness" },
                { label: "AAD", detail: "Tamper-proof headers" },
              ] as const
            ).map((item) => (
              <Card key={item.label} className="border-0 bg-muted/50 shadow-none">
                <CardContent className="pt-6 text-center">
                  <p className="font-mono text-sm font-semibold text-primary">{item.label}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{item.detail}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </Section>

        {/* Safety Numbers */}
        <Section
          icon={Check}
          title={t("safetyNumbers.title")}
          description={t("safetyNumbers.description")}
        >
          <div className="mt-6">
            <Card className="border-0 bg-muted/50 shadow-none">
              <CardContent className="pt-6">
                <p className="text-center font-mono text-sm tracking-widest text-muted-foreground">
                  37291 48503 62814 05927 71360
                  <br />
                  84029 15736 40283 59174 06382
                  <br />
                  92047 31856
                </p>
                <p className="mt-3 text-center text-xs text-muted-foreground">
                  60-digit safety number (example)
                </p>
              </CardContent>
            </Card>
          </div>
        </Section>

        {/* Server Comparison */}
        <div className="mt-16">
          <h2 className="text-2xl font-bold tracking-tight">{t("serverComparison.title")}</h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <Card className="border-0 bg-muted/50 shadow-none">
              <CardContent className="pt-6">
                <div className="mb-3 flex items-center gap-2">
                  <Eye className="size-5 text-muted-foreground" />
                  <h3 className="font-semibold">Stored on server</h3>
                </div>
                <p className="text-sm text-muted-foreground">{t("serverComparison.encrypted")}</p>
              </CardContent>
            </Card>
            <Card className="border-0 bg-primary/5 shadow-none">
              <CardContent className="pt-6">
                <div className="mb-3 flex items-center gap-2">
                  <EyeOff className="size-5 text-primary" />
                  <h3 className="font-semibold">Never accessible</h3>
                </div>
                <p className="text-sm text-muted-foreground">{t("serverComparison.plaintext")}</p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* FAQ */}
        <div className="mt-16">
          <h2 className="text-2xl font-bold tracking-tight">{t("faq.title")}</h2>
          <div className="mt-6 space-y-4">
            {faqItems.map((item) => (
              <Card key={item.question} className="border-0 bg-muted/50 shadow-none">
                <CardContent className="pt-6">
                  <h3 className="font-semibold">{item.question}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{item.answer}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Open Source CTA */}
        <div className="mt-16 rounded-2xl bg-primary/5 p-8 text-center sm:p-12">
          <Code className="mx-auto size-8 text-primary" />
          <h2 className="mt-4 text-2xl font-bold tracking-tight">{t("openSource.title")}</h2>
          <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
            {t("openSource.description")}
          </p>
          <div className="mt-6">
            <Button asChild>
              <Link href="https://github.com/OpenHospi/OpenHospi">{t("openSource.cta")}</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
