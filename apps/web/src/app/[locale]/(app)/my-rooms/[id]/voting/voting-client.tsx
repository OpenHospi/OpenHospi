"use client";

import { ArrowDown, ArrowUp, Check, Loader2, UserCircle } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { VotableApplicant, VoteBoard } from "@/lib/votes";

import { submitVotes } from "./vote-actions";

type Props = {
  roomId: string;
  currentUserId: string;
  voteBoard: VoteBoard;
};

export function VotingClient({ roomId, currentUserId, voteBoard }: Props) {
  const t = useTranslations("app.rooms.voting");
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  // Initialize ranking from existing votes or default order
  const myBallot = voteBoard.ballots.find((b) => b.voterId === currentUserId);
  const initialRanking = myBallot
    ? [...voteBoard.applicants].sort((a, b) => {
        const rankA = myBallot.rankings.find((r) => r.applicantId === a.userId)?.rank ?? 999;
        const rankB = myBallot.rankings.find((r) => r.applicantId === b.userId)?.rank ?? 999;
        return rankA - rankB;
      })
    : voteBoard.applicants;

  const [ranked, setRanked] = useState<VotableApplicant[]>(initialRanking);

  function moveUp(index: number) {
    if (index === 0) return;
    const next = [...ranked];
    [next[index - 1], next[index]] = [next[index], next[index - 1]];
    setRanked(next);
  }

  function moveDown(index: number) {
    if (index === ranked.length - 1) return;
    const next = [...ranked];
    [next[index], next[index + 1]] = [next[index + 1], next[index]];
    setRanked(next);
  }

  function handleSubmit() {
    const rankings = ranked.map((a, i) => ({
      applicantId: a.userId,
      rank: i + 1,
    }));

    startTransition(async () => {
      try {
        await submitVotes(roomId, rankings);
        toast.success(t("submitted"));
        router.refresh();
      } catch {
        toast.error(t("submitError"));
      }
    });
  }

  if (voteBoard.applicants.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-sm text-muted-foreground">
          {t("noApplicants")}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Ranking section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("yourRanking")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {ranked.map((applicant, index) => (
            <div key={applicant.userId} className="flex items-center gap-3 rounded-lg border p-3">
              <span className="w-6 text-center text-sm font-bold text-muted-foreground">
                {index + 1}
              </span>
              <div className="relative size-8 shrink-0 overflow-hidden rounded-full bg-muted">
                {applicant.avatarUrl ? (
                  <Image
                    src={applicant.avatarUrl}
                    alt={applicant.firstName}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="flex size-full items-center justify-center">
                    <UserCircle className="size-5 text-muted-foreground" />
                  </div>
                )}
              </div>
              <span className="flex-1 text-sm font-medium">
                {applicant.firstName} {applicant.lastName}
              </span>
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-7"
                  onClick={() => moveUp(index)}
                  disabled={index === 0}
                  aria-label={t("moveUp")}
                >
                  <ArrowUp className="size-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-7"
                  onClick={() => moveDown(index)}
                  disabled={index === ranked.length - 1}
                  aria-label={t("moveDown")}
                >
                  <ArrowDown className="size-3.5" />
                </Button>
              </div>
            </div>
          ))}

          <Button className="mt-4 w-full" onClick={handleSubmit} disabled={isPending}>
            {isPending ? <Loader2 className="animate-spin" /> : <Check className="size-4" />}
            {myBallot ? t("updateVotes") : t("submitVotes")}
          </Button>
        </CardContent>
      </Card>

      {/* Vote transparency board */}
      {voteBoard.ballots.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("voteBoard")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="pb-2 text-left font-medium">{t("applicant")}</th>
                    {voteBoard.ballots.map((ballot) => (
                      <th key={ballot.voterId} className="pb-2 text-center font-medium">
                        {ballot.voterName}
                      </th>
                    ))}
                    <th className="pb-2 text-center font-medium">{t("total")}</th>
                  </tr>
                </thead>
                <tbody>
                  {voteBoard.aggregated.map((row) => {
                    const applicant = voteBoard.applicants.find(
                      (a) => a.userId === row.applicantId,
                    );
                    if (!applicant) return null;
                    return (
                      <tr key={row.applicantId} className="border-b last:border-0">
                        <td className="py-2 font-medium">
                          {applicant.firstName} {applicant.lastName}
                        </td>
                        {voteBoard.ballots.map((ballot) => {
                          const ranking = ballot.rankings.find(
                            (r) => r.applicantId === row.applicantId,
                          );
                          return (
                            <td key={ballot.voterId} className="py-2 text-center">
                              {ranking ? ranking.rank : "–"}
                            </td>
                          );
                        })}
                        <td className="py-2 text-center">
                          <Badge variant="secondary">{row.totalRank}</Badge>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
