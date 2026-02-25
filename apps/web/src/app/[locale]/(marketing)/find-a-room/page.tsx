"use client";

import {
  HandCoins,
  LogIn,
  Mail,
  MessageCircle,
  PartyPopper,
  Scale,
  Search,
  ShieldCheck,
  UserPlus,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useTranslations } from "next-intl";

import { FeatureCard } from "@/components/marketing/feature-card";
import { StepList } from "@/components/marketing/step-list";
import { Button } from "@/components/ui/button";
import { getLoginUrl } from "@/lib/urls";

const whyIcons = [ShieldCheck, HandCoins, MessageCircle, Scale] as const;
const stepIcons: LucideIcon[] = [LogIn, UserPlus, Search, Mail, Users, PartyPopper];

export default function FindARoomPage() {
  const t = useTranslations("findRoom");
  const loginUrl = getLoginUrl();

  const steps = Array.from({ length: 6 }, (_, i) => ({
    title: t(`steps.items.${i}.title`),
    description: t(`steps.items.${i}.description`),
  }));

  return (
    <>
      {/* Hero */}
      <section className="py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{t("title")}</h1>
            <p className="mt-4 text-lg text-muted-foreground">{t("subtitle")}</p>
          </div>
        </div>
      </section>

      {/* Why section */}
      <section className="bg-muted/30 py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-center text-2xl font-bold sm:text-3xl">{t("why.title")}</h2>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {([0, 1, 2, 3] as const).map((i) => (
              <FeatureCard
                key={i}
                icon={whyIcons[i]}
                title={t(`why.items.${i}.title`)}
                description={t(`why.items.${i}.description`)}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Steps section */}
      <section className="py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="mb-12 text-center text-2xl font-bold sm:text-3xl">{t("steps.title")}</h2>
          <StepList steps={steps} icons={stepIcons} />
        </div>
      </section>

      {/* CTA */}
      <section className="bg-muted/30 py-24">
        <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">{t("cta.title")}</h2>
          <div className="mt-8">
            <Button size="lg" asChild>
              <a href={loginUrl}>{t("cta.button")}</a>
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}
