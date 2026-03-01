import { Vote } from "lucide-react";
import { Link } from "@/i18n/navigation-app";
import { getTranslations } from "next-intl/server";

import { Button } from "@/components/ui/button";

type Props = {
  roomId: string;
};

export async function VotingSection({ roomId }: Props) {
  const t = await getTranslations("app.rooms.voting");

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">{t("title")}</h2>
        <Button variant="outline" size="sm" asChild>
          <Link href={`/my-rooms/${roomId}/voting`}>
            <Vote className="size-4" />
            {t("openVoting")}
          </Link>
        </Button>
      </div>
      <p className="text-sm text-muted-foreground">{t("sectionDescription")}</p>
    </section>
  );
}
