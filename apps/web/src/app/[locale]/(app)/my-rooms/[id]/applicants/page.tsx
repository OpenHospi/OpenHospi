import type { Locale } from "@openhospi/i18n";
import { hasLocale } from "next-intl";
import { setRequestLocale } from "next-intl/server";

import { routing } from "@/i18n/routing";
import { requireSession } from "@/lib/auth/server";
import { getRoomApplicants } from "@/lib/queries/applicants";

import { MarkSeenEffect } from "../mark-seen-effect";

import { ApplicantMasterDetail } from "./applicant-master-detail";

type Props = {
  params: Promise<{ locale: Locale; id: string }>;
};

export default async function ApplicantsPage({ params }: Props) {
  const { locale, id: roomId } = await params;
  if (!hasLocale(routing.locales, locale)) return null;
  setRequestLocale(locale);
  const { user } = await requireSession();

  const applicants = await getRoomApplicants(roomId, user.id);

  return (
    <>
      <MarkSeenEffect roomId={roomId} />
      <ApplicantMasterDetail applicants={applicants} roomId={roomId} currentUserId={user.id} />
    </>
  );
}
