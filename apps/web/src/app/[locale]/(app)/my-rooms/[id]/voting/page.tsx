import { ArrowLeft } from "lucide-react";
import { Link } from "@/i18n/navigation-app";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { Button } from "@/components/ui/button";
import { requireHousemate, requireSession } from "@/lib/auth-server";
import { getRoomVotes } from "@/lib/votes";

import { VotingClient } from "./voting-client";

type Props = {
  params: Promise<{ locale: string; id: string }>;
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "app.rooms.voting" });
  return { title: t("title") };
}

export default async function VotingPage({ params }: Props) {
  const { locale, id: roomId } = await params;
  setRequestLocale(locale);
  const { user } = await requireSession();
  await requireHousemate(roomId, user.id);

  const voteBoard = await getRoomVotes(roomId, user.id);
  const t = await getTranslations("app.rooms.voting");

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Button variant="ghost" size="sm" asChild>
        <Link href={`/my-rooms/${roomId}`}>
          <ArrowLeft className="size-4" />
          {t("backToRoom")}
        </Link>
      </Button>

      <div>
        <h1 className="text-2xl font-bold">{t("title")}</h1>
        <p className="text-sm text-muted-foreground">{t("description")}</p>
      </div>

      <VotingClient roomId={roomId} currentUserId={user.id} voteBoard={voteBoard} />
    </div>
  );
}
