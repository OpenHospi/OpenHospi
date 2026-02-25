import { getTranslations } from "next-intl/server";

import { Badge } from "@/components/ui/badge";
import { getRoomApplicants } from "@/lib/applicants";

import { ApplicantCard } from "./applicant-card";
import { MarkSeenEffect } from "./mark-seen-effect";

type Props = {
  roomId: string;
  userId: string;
};

export async function ApplicantsSection({ roomId, userId }: Props) {
  const applicants = await getRoomApplicants(roomId);
  const t = await getTranslations("app.rooms.applicants");

  return (
    <section className="space-y-4">
      <MarkSeenEffect roomId={roomId} />

      <div className="flex items-center gap-2">
        <h2 className="text-lg font-semibold">{t("title")}</h2>
        {applicants.length > 0 && <Badge variant="secondary">{applicants.length}</Badge>}
      </div>

      {applicants.length === 0 ? (
        <div className="rounded-lg border border-dashed p-8 text-center">
          <p className="text-muted-foreground">{t("empty")}</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {applicants.map((applicant) => (
            <ApplicantCard
              key={applicant.application_id}
              applicant={applicant}
              roomId={roomId}
              currentUserId={userId}
            />
          ))}
        </div>
      )}
    </section>
  );
}
