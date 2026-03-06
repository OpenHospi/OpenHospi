"use client";

import { isTerminalApplicationStatus, ReviewDecision } from "@openhospi/shared/enums";
import { ArrowLeft, Focus } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { UserAvatar } from "@/components/shared/user-avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Link } from "@/i18n/navigation-app";
import type { RoomApplicant } from "@/lib/queries/applicants";
import { APPLICATION_STATUS_COLORS } from "@/lib/status-colors";
import { cn } from "@/lib/utils";

import { ApplicantDetailPanel } from "./applicant-detail-panel";

type Props = {
  applicants: RoomApplicant[];
  roomId: string;
  currentUserId: string;
};

function getAge(birthDate: string | null): number | null {
  if (!birthDate) return null;
  return Math.floor(
    (new Date().getTime() - new Date(birthDate).getTime()) / (365.25 * 24 * 60 * 60 * 1000),
  );
}

function getReviewDot(reviews: RoomApplicant["reviews"], currentUserId: string) {
  const myReview = reviews.find((r) => r.reviewerId === currentUserId);
  if (!myReview) return null;
  if (myReview.decision === ReviewDecision.like) return "bg-green-500";
  if (myReview.decision === ReviewDecision.maybe) return "bg-yellow-500";
  return "bg-red-500";
}

function ApplicantRow({
  applicant,
  isSelected,
  currentUserId,
  onClick,
  className,
}: {
  applicant: RoomApplicant;
  isSelected?: boolean;
  currentUserId: string;
  onClick: () => void;
  className?: string;
}) {
  const tEnums = useTranslations("enums");
  const age = getAge(applicant.birthDate);
  const reviewDot = getReviewDot(applicant.reviews, currentUserId);

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-3 px-3 py-3 text-left transition-colors hover:bg-accent/50",
        isSelected && "border-l-2 border-l-primary bg-accent",
        className,
      )}
    >
      <UserAvatar
        avatarUrl={applicant.avatarUrl}
        userName={`${applicant.firstName} ${applicant.lastName}`}
        size="sm"
        className="rounded-lg"
      />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="truncate text-sm font-medium">
            {applicant.firstName} {applicant.lastName}
          </span>
          {reviewDot && <span className={cn("size-2 shrink-0 rounded-full", reviewDot)} />}
        </div>
        <p className="truncate text-xs text-muted-foreground">
          {applicant.studyProgram}
          {age && <> · {age}</>}
        </p>
      </div>
      <Badge className={cn("shrink-0 text-xs", APPLICATION_STATUS_COLORS[applicant.status])}>
        {tEnums(`application_status.${applicant.status}`)}
      </Badge>
    </button>
  );
}

export function ApplicantMasterDetail({ applicants, roomId, currentUserId }: Props) {
  const t = useTranslations("app.rooms.applicants");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const selectedApplicant = applicants.find((a) => a.applicationId === selectedId) ?? null;
  const reviewableCount = applicants.filter((a) => !isTerminalApplicationStatus(a.status)).length;

  const showDetail = selectedId !== null;

  return (
    <div className="space-y-4">
      {/* Header with review mode button */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {applicants.length} {t("title").toLowerCase()}
        </p>
        {reviewableCount > 0 && (
          <Button variant="outline" size="sm" asChild>
            <Link href={`/my-rooms/${roomId}/review`}>
              <Focus className="size-4" />
              {t("reviewMode")}
            </Link>
          </Button>
        )}
      </div>

      {applicants.length === 0 ? (
        <div className="rounded-lg border border-dashed p-8 text-center">
          <p className="text-muted-foreground">{t("empty")}</p>
        </div>
      ) : (
        <>
          {/* Desktop: side-by-side with independent scroll */}
          <div className="hidden md:flex md:gap-6">
            {/* List panel — fixed width, own scroll */}
            <div className="w-80 shrink-0 overflow-y-auto rounded-lg border">
              {applicants.map((applicant, index) => (
                <div key={applicant.applicationId}>
                  {index > 0 && <Separator />}
                  <ApplicantRow
                    applicant={applicant}
                    isSelected={applicant.applicationId === selectedId}
                    currentUserId={currentUserId}
                    onClick={() => setSelectedId(applicant.applicationId)}
                  />
                </div>
              ))}
            </div>

            {/* Detail panel — fills remaining space */}
            <div className="min-w-0 flex-1">
              {selectedApplicant ? (
                <ApplicantDetailPanel
                  key={selectedApplicant.applicationId}
                  applicant={selectedApplicant}
                  roomId={roomId}
                  currentUserId={currentUserId}
                />
              ) : (
                <div className="flex items-center justify-center py-20">
                  <p className="text-muted-foreground">{t("selectApplicant")}</p>
                </div>
              )}
            </div>
          </div>

          {/* Mobile: list or detail toggle */}
          <div className="md:hidden">
            {showDetail && selectedApplicant ? (
              <div className="space-y-4">
                <Button variant="ghost" size="sm" onClick={() => setSelectedId(null)}>
                  <ArrowLeft className="size-4" />
                  {t("backToList")}
                </Button>
                <ApplicantDetailPanel
                  key={selectedApplicant.applicationId}
                  applicant={selectedApplicant}
                  roomId={roomId}
                  currentUserId={currentUserId}
                />
              </div>
            ) : (
              <div className="rounded-lg border">
                {applicants.map((applicant, index) => (
                  <div key={applicant.applicationId}>
                    {index > 0 && <Separator />}
                    <ApplicantRow
                      applicant={applicant}
                      currentUserId={currentUserId}
                      onClick={() => setSelectedId(applicant.applicationId)}
                      className="px-4"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
