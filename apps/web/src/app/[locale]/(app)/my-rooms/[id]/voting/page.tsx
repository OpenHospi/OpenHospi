import type { Locale } from "@openhospi/i18n";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { Main } from "@/components/layout/main";
import { routing } from "@/i18n/routing";
import { requireHousemate, requireSession } from "@/lib/auth/server";
import { getRoomVotes } from "@/lib/queries/votes";

import { VotingClient } from "./voting-client";

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
  const t = await getTranslations({ locale, namespace: "app.rooms.voting" });
  return { title: t("title") };
}

export default async function VotingPage({ params }: Props) {
  const { locale, id: roomId } = await params;
  if (!hasLocale(routing.locales, locale)) return null;
  setRequestLocale(locale);
  const { user } = await requireSession();
  await requireHousemate(roomId, user.id);

  const voteBoard = await getRoomVotes(roomId, user.id);

  return (
    <Main>
      <VotingClient roomId={roomId} currentUserId={user.id} voteBoard={voteBoard} />
    </Main>
  );
}
