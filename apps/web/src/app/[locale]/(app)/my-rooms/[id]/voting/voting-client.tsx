"use client";

import { ArrowDown, ArrowUp, Check, Loader2, UserCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
              <Avatar>
                {applicant.avatarUrl ? (
                  <AvatarImage src={applicant.avatarUrl} alt={applicant.firstName} />
                ) : (
                  <AvatarFallback>
                    <UserCircle className="size-5" />
                  </AvatarFallback>
                )}
              </Avatar>
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
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("applicant")}</TableHead>
                    {voteBoard.ballots.map((ballot) => (
                      <TableHead key={ballot.voterId} className="text-center">
                        {ballot.voterName}
                      </TableHead>
                    ))}
                    <TableHead className="text-center">{t("total")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {voteBoard.aggregated.map((row) => {
                    const applicant = voteBoard.applicants.find(
                      (a) => a.userId === row.applicantId,
                    );
                    if (!applicant) return null;
                    return (
                      <TableRow key={row.applicantId}>
                        <TableCell className="font-medium">
                          {applicant.firstName} {applicant.lastName}
                        </TableCell>
                        {voteBoard.ballots.map((ballot) => {
                          const ranking = ballot.rankings.find(
                            (r) => r.applicantId === row.applicantId,
                          );
                          return (
                            <TableCell key={ballot.voterId} className="text-center">
                              {ranking ? ranking.rank : "–"}
                            </TableCell>
                          );
                        })}
                        <TableCell className="text-center">
                          <Badge variant="secondary">{row.totalRank}</Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
