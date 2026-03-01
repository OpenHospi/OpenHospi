"use client";

import {
  ApplicationStatus,
  INVITABLE_APPLICATION_STATUSES,
  ReviewDecision,
} from "@openhospi/shared/enums";
import { Check, Loader2, Minus, ThumbsDown, ThumbsUp, UserCircle, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useMemo, useState, useTransition } from "react";
import { toast } from "sonner";

import { InstitutionBadge } from "@/components/app/institution-badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import type { RoomApplicant } from "@/lib/applicants";
import { APPLICATION_STATUS_COLORS } from "@/lib/status-colors";
import { cn } from "@/lib/utils";

import { submitReview, updateApplicationStatus } from "./applicant-actions";
import { ApplicantProfileSheet } from "./applicant-profile-sheet";

type Props = {
  applicant: RoomApplicant;
  roomId: string;
  currentUserId: string;
};

export function ApplicantCard({ applicant, roomId, currentUserId }: Props) {
  const t = useTranslations("app.rooms.applicants");
  const tCommon = useTranslations("common.labels");
  const tEnums = useTranslations("enums");
  const [isPending, startTransition] = useTransition();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [acceptDialogOpen, setAcceptDialogOpen] = useState(false);
  const router = useRouter();

  const myReview = applicant.reviews.find((r) => r.reviewerId === currentUserId);

  function handleReview(decision: ReviewDecision) {
    startTransition(async () => {
      const result = await submitReview(roomId, applicant.userId, {
        decision,
      });
      if (result?.error) {
        toast.error(t("reviewError"));
        return;
      }
      router.refresh();
    });
  }

  function handleStatusChange(newStatus: ApplicationStatus) {
    startTransition(async () => {
      const result = await updateApplicationStatus(roomId, applicant.applicationId, newStatus);
      if (result?.error) {
        toast.error(t("statusError"));
        return;
      }
      toast.success(t("statusUpdated"));
      router.refresh();
    });
  }

  const age = useMemo(() => {
    if (!applicant.birthDate) return null;
    return Math.floor(
      (new Date().getTime() - new Date(applicant.birthDate).getTime()) /
        (365.25 * 24 * 60 * 60 * 1000),
    );
  }, [applicant.birthDate]);

  // Review summary from other housemates
  const likeCounts = { like: 0, maybe: 0, reject: 0 };
  for (const r of applicant.reviews) {
    likeCounts[r.decision]++;
  }

  return (
    <>
      <Card className="overflow-hidden">
        <CardHeader className="flex flex-row items-start gap-3 pb-2">
          <Avatar className="size-12">
            {applicant.avatarUrl ? (
              <AvatarImage src={applicant.avatarUrl} alt={applicant.firstName} />
            ) : (
              <AvatarFallback>
                <UserCircle className="size-8" />
              </AvatarFallback>
            )}
          </Avatar>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h3 className="truncate font-semibold">
                {applicant.firstName} {applicant.lastName}
              </h3>
              <Badge className={cn("shrink-0", APPLICATION_STATUS_COLORS[applicant.status])}>
                {tEnums(`application_status.${applicant.status}`)}
              </Badge>
            </div>
            <p className="truncate text-sm text-muted-foreground">
              {applicant.studyProgram}
              {applicant.studyLevel && <> · {tEnums(`study_level.${applicant.studyLevel}`)}</>}
              {age && <> · {age}</>}
            </p>
            <InstitutionBadge domain={applicant.institutionDomain} />
          </div>
        </CardHeader>

        <CardContent className="space-y-3">
          {/* Bio excerpt */}
          {applicant.bio && (
            <p className="line-clamp-2 text-sm text-muted-foreground">{applicant.bio}</p>
          )}

          {/* Lifestyle tags */}
          {applicant.lifestyleTags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {applicant.lifestyleTags.slice(0, 4).map((tag) => (
                <Badge key={tag} variant="outline" className="text-xs">
                  {tEnums(`lifestyle_tag.${tag}`)}
                </Badge>
              ))}
              {applicant.lifestyleTags.length > 4 && (
                <Badge variant="outline" className="text-xs">
                  +{applicant.lifestyleTags.length - 4}
                </Badge>
              )}
            </div>
          )}

          {/* Personal message preview */}
          {applicant.personalMessage && (
            <p className="line-clamp-2 text-sm italic text-muted-foreground">
              &ldquo;{applicant.personalMessage}&rdquo;
            </p>
          )}

          {/* Review summary */}
          {applicant.reviews.length > 0 && (
            <p className="text-xs text-muted-foreground">
              {likeCounts.like > 0 && `${likeCounts.like} ${t("liked")} `}
              {likeCounts.maybe > 0 && `· ${likeCounts.maybe} ${t("maybe")} `}
              {likeCounts.reject > 0 && `· ${likeCounts.reject} ${t("rejected")}`}
            </p>
          )}

          {/* Quick review buttons */}
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant={myReview?.decision === ReviewDecision.like ? "default" : "outline"}
              onClick={() => handleReview(ReviewDecision.like)}
              disabled={isPending}
            >
              <ThumbsUp className="size-3.5" />
            </Button>
            <Button
              size="sm"
              variant={myReview?.decision === ReviewDecision.maybe ? "default" : "outline"}
              onClick={() => handleReview(ReviewDecision.maybe)}
              disabled={isPending}
            >
              <Minus className="size-3.5" />
            </Button>
            <Button
              size="sm"
              variant={myReview?.decision === ReviewDecision.reject ? "destructive" : "outline"}
              onClick={() => handleReview(ReviewDecision.reject)}
              disabled={isPending}
            >
              <ThumbsDown className="size-3.5" />
            </Button>

            <Button
              size="sm"
              variant="ghost"
              className="ml-auto"
              onClick={() => setSheetOpen(true)}
            >
              {t("viewProfile")}
            </Button>
          </div>

          {/* Status action buttons (owner/admin) */}
          <div className="flex flex-wrap gap-2">
            {(INVITABLE_APPLICATION_STATUSES as readonly string[]).includes(applicant.status) && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleStatusChange(ApplicationStatus.invited)}
                disabled={isPending}
              >
                {isPending && <Loader2 className="animate-spin" />}
                {t("invite")}
              </Button>
            )}
            {applicant.status === ApplicationStatus.invited && (
              <>
                <Button size="sm" onClick={() => setAcceptDialogOpen(true)} disabled={isPending}>
                  <Check className="size-3.5" />
                  {t("accept")}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleStatusChange(ApplicationStatus.not_chosen)}
                  disabled={isPending}
                >
                  <X className="size-3.5" />
                  {t("notChosen")}
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      <ApplicantProfileSheet
        applicant={applicant}
        roomId={roomId}
        currentUserId={currentUserId}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
      />

      <AlertDialog open={acceptDialogOpen} onOpenChange={setAcceptDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("acceptConfirmTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("acceptConfirmDescription", {
                name: applicant.firstName,
              })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{tCommon("cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={() => handleStatusChange(ApplicationStatus.accepted)}>
              {t("accept")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
