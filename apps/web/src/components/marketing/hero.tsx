"use client";

import { motion } from "framer-motion";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";

export function Hero() {
  const t = useTranslations("home.hero");

  return (
    <section className="relative overflow-hidden py-24 sm:py-32 lg:py-40">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          className="mx-auto max-w-3xl text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          style={{ willChange: "opacity, transform" }}
        >
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
            {t("title")
              .split("\n")
              .map((line, i) => (
                <span key={i}>
                  {i > 0 && <br />}
                  {i === 0 ? <span className="text-primary">{line}</span> : line}
                </span>
              ))}
          </h1>
          <p className="mt-6 text-lg text-muted-foreground sm:text-xl">{t("subtitle")}</p>
          <div className="mt-10">
            <Button size="lg" asChild>
              <Link href="/api/auth/signin">{t("cta")}</Link>
            </Button>
          </div>
        </motion.div>
      </div>
      {/* Decorative gradient blob */}
      <div
        className="absolute -top-40 -right-40 -z-10 size-[500px] rounded-full bg-primary/5 blur-3xl"
        aria-hidden="true"
      />
      <div
        className="absolute -bottom-40 -left-40 -z-10 size-[500px] rounded-full bg-primary/5 blur-3xl"
        aria-hidden="true"
      />
    </section>
  );
}
