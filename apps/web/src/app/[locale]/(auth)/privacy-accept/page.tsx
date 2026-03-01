"use client";

import { PRIVACY_POLICY_VERSION } from "@openhospi/shared/constants";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useTransition } from "react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { acceptPrivacyPolicy } from "./actions";

export default function PrivacyAcceptPage() {
  const t = useTranslations("app.privacyAccept");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleAccept() {
    startTransition(async () => {
      await acceptPrivacyPolicy();
      router.push("/discover");
      router.refresh();
    });
  }

  return (
    <Card className="w-full max-w-lg">
      <CardHeader>
        <CardTitle>{t("title")}</CardTitle>
        <CardDescription>{t("description")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">{t("summary")}</p>
        <p className="text-xs text-muted-foreground">Version {PRIVACY_POLICY_VERSION}</p>
        <Link
          href="/privacy-policy"
          className="text-sm text-primary underline underline-offset-4"
          target="_blank"
        >
          {t("viewFullPolicy")}
        </Link>
      </CardContent>
      <CardFooter>
        <Button onClick={handleAccept} disabled={isPending} className="w-full">
          {t("acceptButton")}
        </Button>
      </CardFooter>
    </Card>
  );
}
