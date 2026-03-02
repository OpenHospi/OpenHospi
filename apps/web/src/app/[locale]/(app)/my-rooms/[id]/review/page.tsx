import type { Locale } from "@openhospi/i18n";
import { isTerminalApplicationStatus } from "@openhospi/shared/enums";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { redirect } from "@/i18n/navigation-app";
import { routing } from "@/i18n/routing";
import { getRoomApplicants } from "@/lib/applicants";
import { requireHousemate, requireSession } from "@/lib/auth-server";

import { ReviewModeClient } from "./review-mode-client";

type Props = {
  params: Promise<{ locale: Locale; id: string }>;
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale; id: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) return {};
  const t = await getTranslations({ locale, namespace: "app.rooms.reviewMode" });
  return { title: t("title") };
}

export default async function ReviewModePage({ params }: Props) {
  const { locale, id } = await params;
  if (!hasLocale(routing.locales, locale)) return null;
  setRequestLocale(locale);
  const { user } = await requireSession();
  await requireHousemate(id, user.id);

  const allApplicants = await getRoomApplicants(id, user.id);
  const reviewable = allApplicants.filter((a) => !isTerminalApplicationStatus(a.status));

  if (reviewable.length === 0) {
    return redirect({ href: `/my-rooms/${id}`, locale });
  }

  return <ReviewModeClient applicants={reviewable} roomId={id} currentUserId={user.id} />;
}
