"use client";

import type { DragEndEvent, DragStartEvent } from "@dnd-kit/core";
import {
  closestCenter,
  DndContext,
  DragOverlay,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ArrowDown, ArrowUp, Check, GripVertical, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { UserAvatar } from "@/components/user-avatar";
import { useRouter } from "@/i18n/navigation-app";
import type { VotableApplicant, VoteBoard } from "@/lib/votes";

import { submitVotes } from "./vote-actions";

type Props = {
  roomId: string;
  currentUserId: string;
  voteBoard: VoteBoard;
};

function getAge(birthDate: string | null): number | null {
  if (!birthDate) return null;
  return Math.floor(
    (new Date().getTime() - new Date(birthDate).getTime()) / (365.25 * 24 * 60 * 60 * 1000),
  );
}

function SortableApplicantRow({
  applicant,
  rank,
  isFirst,
  isLast,
  onMoveUp,
  onMoveDown,
  isDragOverlay,
}: {
  applicant: VotableApplicant;
  rank: number;
  isFirst: boolean;
  isLast: boolean;
  onMoveUp: () => void;
  onMoveDown: () => void;
  isDragOverlay?: boolean;
}) {
  const t = useTranslations("app.rooms.voting");
  const tEnums = useTranslations("enums");

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: applicant.userId,
    disabled: isDragOverlay,
  });

  const style = isDragOverlay
    ? undefined
    : {
        transform: CSS.Transform.toString(transform),
        transition,
      };

  const age = getAge(applicant.birthDate);
  const subtitleParts = [
    applicant.studyProgram,
    applicant.studyLevel ? tEnums(`study_level.${applicant.studyLevel}`) : null,
    age,
  ].filter(Boolean);

  return (
    <div
      ref={isDragOverlay ? undefined : setNodeRef}
      style={style}
      className={`flex items-center gap-3 rounded-lg border bg-card px-3 py-3 ${
        isDragging ? "opacity-50" : ""
      } ${isDragOverlay ? "shadow-lg ring-2 ring-primary" : ""}`}
    >
      <button
        type="button"
        className="cursor-grab touch-none text-muted-foreground hover:text-foreground active:cursor-grabbing"
        aria-label={t("dragToReorder")}
        {...(isDragOverlay ? {} : attributes)}
        {...(isDragOverlay ? {} : listeners)}
      >
        <GripVertical className="size-4" />
      </button>

      <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
        {rank}
      </span>

      <UserAvatar
        avatarUrl={applicant.avatarUrl}
        userName={`${applicant.firstName} ${applicant.lastName}`}
        size="sm"
        className="rounded-lg"
      />

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">
          {applicant.firstName} {applicant.lastName}
        </p>
        {subtitleParts.length > 0 && (
          <p className="truncate text-xs text-muted-foreground">{subtitleParts.join(" · ")}</p>
        )}
      </div>

      <div className="flex gap-1">
        <Button
          variant="ghost"
          size="icon"
          className="size-7"
          onClick={onMoveUp}
          disabled={isFirst}
          aria-label={t("moveUp")}
        >
          <ArrowUp className="size-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="size-7"
          onClick={onMoveDown}
          disabled={isLast}
          aria-label={t("moveDown")}
        >
          <ArrowDown className="size-3.5" />
        </Button>
      </div>
    </div>
  );
}

export function VotingClient({ roomId, currentUserId, voteBoard }: Props) {
  const t = useTranslations("app.rooms.voting");
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const myBallot = voteBoard.ballots.find((b) => b.voterId === currentUserId);
  const initialRanking = myBallot
    ? [...voteBoard.applicants].sort((a, b) => {
        const rankA = myBallot.rankings.find((r) => r.applicantId === a.userId)?.rank ?? 999;
        const rankB = myBallot.rankings.find((r) => r.applicantId === b.userId)?.rank ?? 999;
        return rankA - rankB;
      })
    : voteBoard.applicants;

  const [ranked, setRanked] = useState<VotableApplicant[]>(initialRanking);
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } }),
  );

  function handleDragStart(event: DragStartEvent) {
    setActiveId(event.active.id as string);
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveId(null);
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    setRanked((prev) => {
      const oldIndex = prev.findIndex((a) => a.userId === active.id);
      const newIndex = prev.findIndex((a) => a.userId === over.id);
      return arrayMove(prev, oldIndex, newIndex);
    });
  }

  function moveUp(index: number) {
    if (index === 0) return;
    setRanked((prev) => arrayMove(prev, index, index - 1));
  }

  function moveDown(index: number) {
    if (index === ranked.length - 1) return;
    setRanked((prev) => arrayMove(prev, index, index + 1));
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
      <div className="rounded-lg border border-dashed p-8 text-center">
        <p className="text-muted-foreground">{t("noApplicants")}</p>
      </div>
    );
  }

  const activeApplicant = activeId ? ranked.find((a) => a.userId === activeId) : null;
  const activeIndex = activeId ? ranked.findIndex((a) => a.userId === activeId) : -1;

  return (
    <div className="space-y-6">
      {/* Ranking section */}
      <div className="space-y-3">
        <div>
          <h2 className="text-sm font-medium">{t("yourRanking")}</h2>
          <p className="text-xs text-muted-foreground">{t("description")}</p>
        </div>

        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={ranked.map((a) => a.userId)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-2">
              {ranked.map((applicant, index) => (
                <SortableApplicantRow
                  key={applicant.userId}
                  applicant={applicant}
                  rank={index + 1}
                  isFirst={index === 0}
                  isLast={index === ranked.length - 1}
                  onMoveUp={() => moveUp(index)}
                  onMoveDown={() => moveDown(index)}
                />
              ))}
            </div>
          </SortableContext>

          <DragOverlay>
            {activeApplicant ? (
              <SortableApplicantRow
                applicant={activeApplicant}
                rank={activeIndex + 1}
                isFirst={false}
                isLast={false}
                onMoveUp={() => {}}
                onMoveDown={() => {}}
                isDragOverlay
              />
            ) : null}
          </DragOverlay>
        </DndContext>

        <Button className="w-full" onClick={handleSubmit} disabled={isPending}>
          {isPending ? <Loader2 className="animate-spin" /> : <Check className="size-4" />}
          {myBallot ? t("updateVotes") : t("submitVotes")}
        </Button>
      </div>

      {/* Vote board section */}
      {voteBoard.ballots.length > 0 && (
        <>
          <Separator />

          <div className="space-y-3">
            <h2 className="text-sm font-medium">{t("voteBoard")}</h2>

            <div className="overflow-x-auto rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[140px]">{t("applicant")}</TableHead>
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
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <UserAvatar
                              avatarUrl={applicant.avatarUrl}
                              userName={`${applicant.firstName} ${applicant.lastName}`}
                              size="sm"
                              className="rounded-lg"
                            />
                            <span className="font-medium">
                              {applicant.firstName} {applicant.lastName}
                            </span>
                          </div>
                        </TableCell>
                        {voteBoard.ballots.map((ballot) => {
                          const ranking = ballot.rankings.find(
                            (r) => r.applicantId === row.applicantId,
                          );
                          return (
                            <TableCell key={ballot.voterId} className="text-center tabular-nums">
                              {ranking ? ranking.rank : "–"}
                            </TableCell>
                          );
                        })}
                        <TableCell className="text-center">
                          <Badge variant="secondary" className="tabular-nums">
                            {row.totalRank}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
