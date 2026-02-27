"use client";

import { ReviewDecision } from "@openhospi/shared/enums";
import { ArrowLeft, Minus, ThumbsDown, ThumbsUp, UserCircle } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useState, useTransition } from "react";
import { toast } from "sonner";

import { InstitutionBadge } from "@/components/app/institution-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import type { RoomApplicant } from "@/lib/applicants";
import { cn } from "@/lib/utils";

import { submitReview } from "../applicant-actions";

type Props = {
  applicants: RoomApplicant[];
  roomId: string;
  currentUserId: string;
};

export function ReviewModeClient({ applicants, roomId, currentUserId }: Props) {
  const t = useTranslations("app.rooms.reviewMode");
  const tEnums = useTranslations("enums");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const applicant = applicants[currentIndex];
  const myReview = applicant?.reviews.find((r) => r.reviewerId === currentUserId);
  const otherReviews = applicant?.reviews.filter((r) => r.reviewerId !== currentUserId) ?? [];

  const age = applicant?.birthDate
    ? Math.floor(
        (new Date().getTime() - new Date(applicant.birthDate).getTime()) /
          (365.25 * 24 * 60 * 60 * 1000),
      )
    : null;

  const progress = ((currentIndex + 1) / applicants.length) * 100;

  function handleReview(decision: ReviewDecision) {
    if (!applicant) return;
    startTransition(async () => {
      const result = await submitReview(roomId, applicant.userId, { decision });
      if (result?.error) {
        toast.error(t("reviewError"));
        return;
      }
      // Auto-advance
      if (currentIndex < applicants.length - 1) {
        setCurrentIndex((i) => i + 1);
      } else {
        toast.success(t("allReviewed"));
        router.push(`/my-rooms/${roomId}`);
      }
    });
  }

  const goNext = useCallback(() => {
    if (currentIndex < applicants.length - 1) setCurrentIndex((i) => i + 1);
  }, [currentIndex, applicants.length]);

  const goPrev = useCallback(() => {
    if (currentIndex > 0) setCurrentIndex((i) => i - 1);
  }, [currentIndex]);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (isPending) return;
      if (e.key === "ArrowRight") goNext();
      if (e.key === "ArrowLeft") goPrev();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [goNext, goPrev, isPending]);

  if (!applicant) return null;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" asChild>
          <Link href={`/my-rooms/${roomId}`}>
            <ArrowLeft className="size-4" />
            {t("backToOverview")}
          </Link>
        </Button>
        <span className="text-sm text-muted-foreground">
          {currentIndex + 1} / {applicants.length}
        </span>
      </div>

      <Progress value={progress} className="h-1.5" />

      {/* Profile photos */}
      {applicant.photos.length > 0 ? (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {applicant.photos.map((photo) => (
            <div
              key={photo.id}
              className="relative aspect-square overflow-hidden rounded-lg bg-muted"
            >
              <Image
                src={photo.url}
                alt={photo.caption ?? applicant.firstName}
                fill
                className="object-cover"
              />
            </div>
          ))}
        </div>
      ) : (
        <div className="flex items-center justify-center rounded-lg bg-muted p-12">
          <UserCircle className="size-20 text-muted-foreground" />
        </div>
      )}

      {/* Name & basic info */}
      <div className="space-y-1">
        <h1 className="text-2xl font-bold">
          {applicant.firstName} {applicant.lastName}
          {age && <span className="ml-2 text-lg font-normal text-muted-foreground">{age}</span>}
        </h1>
        <InstitutionBadge domain={applicant.institutionDomain} />
        {applicant.studyProgram && (
          <p className="text-sm text-muted-foreground">
            {applicant.studyProgram}
            {applicant.studyLevel && <> · {tEnums(`study_level.${applicant.studyLevel}`)}</>}
          </p>
        )}
        {applicant.vereniging && (
          <p className="text-sm text-muted-foreground">
            {tEnums(`vereniging.${applicant.vereniging}`)}
          </p>
        )}
      </div>

      {/* Bio */}
      {applicant.bio && (
        <div>
          <h3 className="text-sm font-semibold">{t("about")}</h3>
          <p className="mt-1 whitespace-pre-line text-sm text-muted-foreground">{applicant.bio}</p>
        </div>
      )}

      {/* Lifestyle tags */}
      {applicant.lifestyleTags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {applicant.lifestyleTags.map((tag) => (
            <Badge key={tag} variant="outline" className="text-xs">
              {tEnums(`lifestyle_tag.${tag}`)}
            </Badge>
          ))}
        </div>
      )}

      {/* Personal message */}
      {applicant.personalMessage && (
        <div>
          <h3 className="text-sm font-semibold">{t("personalMessage")}</h3>
          <p className="mt-1 whitespace-pre-line text-sm italic text-muted-foreground">
            {applicant.personalMessage}
          </p>
        </div>
      )}

      {/* Housemate reviews */}
      {otherReviews.length > 0 && (
        <div className="rounded-lg border p-4">
          <h3 className="mb-2 text-sm font-semibold">{t("housemateReviews")}</h3>
          <div className="space-y-2">
            {otherReviews.map((rv) => (
              <div key={rv.reviewerId} className="flex items-start gap-2 text-sm">
                <Badge
                  variant="outline"
                  className={cn(
                    "shrink-0",
                    rv.decision === "like" && "border-green-500 text-green-700 dark:text-green-400",
                    rv.decision === "maybe" &&
                      "border-yellow-500 text-yellow-700 dark:text-yellow-400",
                    rv.decision === "reject" && "border-red-500 text-red-700 dark:text-red-400",
                  )}
                >
                  {tEnums(`review_decision.${rv.decision}`)}
                </Badge>
                <span className="font-medium">{rv.reviewerName}</span>
                {rv.notes && <span className="text-muted-foreground">— {rv.notes}</span>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Action buttons */}
      <div className="flex items-center justify-center gap-4 border-t pt-6">
        <Button
          size="lg"
          variant={myReview?.decision === ReviewDecision.reject ? "destructive" : "outline"}
          onClick={() => handleReview(ReviewDecision.reject)}
          disabled={isPending}
          className="size-14 rounded-full"
        >
          <ThumbsDown className="size-6" />
          <span className="sr-only">{tEnums("review_decision.reject")}</span>
        </Button>
        <Button
          size="lg"
          variant={myReview?.decision === ReviewDecision.maybe ? "default" : "outline"}
          onClick={() => handleReview(ReviewDecision.maybe)}
          disabled={isPending}
          className="size-14 rounded-full"
        >
          <Minus className="size-6" />
          <span className="sr-only">{tEnums("review_decision.maybe")}</span>
        </Button>
        <Button
          size="lg"
          variant={myReview?.decision === ReviewDecision.like ? "default" : "outline"}
          onClick={() => handleReview(ReviewDecision.like)}
          disabled={isPending}
          className="size-14 rounded-full"
        >
          <ThumbsUp className="size-6" />
          <span className="sr-only">{tEnums("review_decision.like")}</span>
        </Button>
      </div>

      {/* Navigation */}
      <div className="flex justify-between text-sm text-muted-foreground">
        <Button
          variant="ghost"
          size="sm"
          onClick={goPrev}
          disabled={currentIndex === 0 || isPending}
        >
          {t("previous")}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={goNext}
          disabled={currentIndex === applicants.length - 1 || isPending}
        >
          {t("next")}
        </Button>
      </div>
    </div>
  );
}
