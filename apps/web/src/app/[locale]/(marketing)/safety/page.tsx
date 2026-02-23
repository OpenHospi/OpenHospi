"use client";

import { ShieldCheck, Lock, EyeOff, Scale, Code, Flag } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useTranslations } from "next-intl";

import { Card, CardContent } from "@/components/ui/card";

const icons: LucideIcon[] = [ShieldCheck, Lock, EyeOff, Scale, Code, Flag];

export default function SafetyPage() {
  const t = useTranslations("safety");

  return (
    <section className="py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{t("title")}</h1>
          <p className="mt-4 text-lg text-muted-foreground">{t("subtitle")}</p>
        </div>

        <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {icons.map((Icon, i) => (
            <Card key={i} className="border-0 bg-muted/50 shadow-none">
              <CardContent className="pt-6">
                <div className="mb-4 flex size-12 items-center justify-center rounded-lg bg-primary/10">
                  <Icon className="size-6 text-primary" />
                </div>
                <h3 className="text-lg font-semibold">{t(`features.${i}.title`)}</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  {t(`features.${i}.description`)}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
