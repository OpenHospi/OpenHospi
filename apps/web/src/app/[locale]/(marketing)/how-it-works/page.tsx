"use client";

import {
  ClipboardList,
  Home,
  LogIn,
  Mail,
  Search,
  Share2,
  Sparkles,
  UserPlus,
  Users,
  Eye,
  PartyPopper,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useTranslations } from "next-intl";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const seekerIcons: LucideIcon[] = [LogIn, UserPlus, Search, Mail, Users, PartyPopper];
const houseIcons: LucideIcon[] = [LogIn, Home, Share2, Eye, ClipboardList, Sparkles];

function StepList({
  steps,
  icons,
}: {
  steps: { title: string; description: string }[];
  icons: LucideIcon[];
}) {
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {steps.map((step, i) => {
        const Icon = icons[i];
        return (
          <div key={i} className="rounded-lg border bg-card p-6">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                {i + 1}
              </div>
              <Icon className="size-5 text-primary" />
            </div>
            <h3 className="mt-4 font-semibold">{step.title}</h3>
            <p className="mt-2 text-sm text-muted-foreground">{step.description}</p>
          </div>
        );
      })}
    </div>
  );
}

export default function HowItWorksPage() {
  const t = useTranslations("howItWorks");

  const seekerSteps = Array.from({ length: 6 }, (_, i) => ({
    title: t(`seeker.steps.${i}.title`),
    description: t(`seeker.steps.${i}.description`),
  }));

  const houseSteps = Array.from({ length: 6 }, (_, i) => ({
    title: t(`house.steps.${i}.title`),
    description: t(`house.steps.${i}.description`),
  }));

  return (
    <section className="py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{t("title")}</h1>
          <p className="mt-4 text-lg text-muted-foreground">{t("subtitle")}</p>
        </div>

        <Tabs defaultValue="seeker" className="mt-12">
          <TabsList className="mx-auto grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="seeker">{t("seekerTab")}</TabsTrigger>
            <TabsTrigger value="house">{t("houseTab")}</TabsTrigger>
          </TabsList>
          <TabsContent value="seeker" className="mt-8">
            <StepList steps={seekerSteps} icons={seekerIcons} />
          </TabsContent>
          <TabsContent value="house" className="mt-8">
            <StepList steps={houseSteps} icons={houseIcons} />
          </TabsContent>
        </Tabs>
      </div>
    </section>
  );
}
