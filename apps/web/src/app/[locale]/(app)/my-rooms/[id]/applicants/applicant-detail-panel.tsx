"use client";

import type { ReviewData } from "@openhospi/database/validators";
import { reviewSchema } from "@openhospi/database/validators";
import { MAX_NOTES_LENGTH, STORAGE_BUCKET_PROFILE_PHOTOS } from "@openhospi/shared/constants";
import { ApplicationStatus, ReviewDecision } from "@openhospi/shared/enums";
import { Check, Loader2, UserCircle, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useMemo, useTransition } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { InstitutionBadge } from "@/components/shared/institution-badge";
import { RoomGalleryHero } from "@/components/shared/room-gallery-hero";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { useRouter } from "@/i18n/navigation-app";
import { zodResolver } from "@/lib/form-utils";
import type { RoomApplicant } from "@/lib/queries/applicants";
import { cn } from "@/lib/utils";

import { submitReview, updateApplicationStatus } from "../applicant-actions";

type Props = {
  applicant: RoomApplicant;
  roomId: string;
  currentUserId: string;
};

export function ApplicantDetailPanel({ applicant, roomId, currentUserId }: Props) {
  const t = useTranslations("app.rooms.applicants");
  const tCommon = useTranslations("common.labels");
  const tEnums = useTranslations("enums");
  const tReview = useTranslations("app.rooms.reviewMode");
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const myReview = applicant.reviews.find((r) => r.reviewerId === currentUserId);
  const otherReviews = applicant.reviews.filter((r) => r.reviewerId !== currentUserId);

  const form = useForm<ReviewData>({
    resolver: zodResolver(reviewSchema),
    defaultValues: {
      decision: myReview?.decision ?? undefined,
      notes: myReview?.notes ?? "",
    },
  });

  const age = useMemo(() => {
    if (!applicant.birthDate) return null;
    return Math.floor(
      (new Date().getTime() - new Date(applicant.birthDate).getTime()) /
        (365.25 * 24 * 60 * 60 * 1000),
    );
  }, [applicant.birthDate]);

  function onSubmitReview(data: ReviewData) {
    startTransition(async () => {
      const result = await submitReview(roomId, applicant.userId, data);
      if (result?.error) {
        toast.error(t("reviewError"));
        return;
      }
      toast.success(t("reviewSubmitted"));
      router.refresh();
    });
  }

  function handleStatusChange(newStatus: ApplicationStatus) {
    startTransition(async () => {
      try {
        const result = await updateApplicationStatus(roomId, applicant.applicationId, newStatus);
        if (result?.error) {
          toast.error(t("statusError"));
          return;
        }
        toast.success(t("statusUpdated"));
        router.refresh();
      } catch {
        toast.error(t("statusError"));
      }
    });
  }

  return (
    <div className="space-y-6">
      {/* Profile photos */}
      {applicant.photos.length > 0 ? (
        <RoomGalleryHero
          photos={applicant.photos}
          roomTitle={`${applicant.firstName} ${applicant.lastName}`}
          bucket={STORAGE_BUCKET_PROFILE_PHOTOS}
        />
      ) : (
        <div className="flex items-center justify-center rounded-lg bg-muted p-8">
          <UserCircle className="size-16 text-muted-foreground" />
        </div>
      )}

      {/* Name & basic info */}
      <div className="space-y-1">
        <h2 className="text-xl font-bold">
          {applicant.firstName} {applicant.lastName}
          {age && <span className="ml-2 text-base font-normal text-muted-foreground">{age}</span>}
        </h2>
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
          <h3 className="text-sm font-semibold">{t("aboutThem")}</h3>
          <p className="mt-1 whitespace-pre-line text-sm text-muted-foreground">{applicant.bio}</p>
        </div>
      )}

      {/* Lifestyle tags */}
      {applicant.lifestyleTags.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold">{t("lifestyle")}</h3>
          <div className="mt-1 flex flex-wrap gap-1">
            {applicant.lifestyleTags.map((tag) => (
              <Badge key={tag} variant="outline" className="text-xs">
                {tEnums(`lifestyle_tag.${tag}`)}
              </Badge>
            ))}
          </div>
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
        <Card>
          <CardContent className="pt-4">
            <h3 className="mb-2 text-sm font-semibold">{tReview("housemateReviews")}</h3>
            <div className="space-y-2">
              {otherReviews.map((rv) => (
                <div key={rv.reviewerId} className="flex items-start gap-2 text-sm">
                  <Badge
                    variant="outline"
                    className={cn(
                      "shrink-0",
                      rv.decision === "like" &&
                        "border-green-500 text-green-700 dark:text-green-400",
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
          </CardContent>
        </Card>
      )}

      {/* Review form */}
      <div className="border-t pt-4">
        <h3 className="text-sm font-semibold">{t("yourReview")}</h3>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmitReview)} className="mt-3 space-y-4">
            <FormField
              control={form.control}
              name="decision"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("decision")}</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      value={field.value}
                      className="flex gap-3"
                    >
                      {ReviewDecision.values.map((d) => (
                        <Label
                          key={d}
                          className="border-input has-data-[state=checked]:border-primary flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-sm"
                        >
                          <RadioGroupItem value={d} />
                          {tEnums(`review_decision.${d}`)}
                        </Label>
                      ))}
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {t("notes")}{" "}
                    <span className="font-normal text-muted-foreground">
                      ({tCommon("optional")})
                    </span>
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      className="min-h-20 resize-none"
                      placeholder={t("notesPlaceholder")}
                      maxLength={MAX_NOTES_LENGTH}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" disabled={isPending} className="w-full">
              {isPending && <Loader2 className="animate-spin" />}
              {t("submitReview")}
            </Button>
          </form>
        </Form>
      </div>

      {/* Status action buttons — Accept / Not Chosen (only when invited) */}
      {applicant.status === ApplicationStatus.hospi && (
        <div className="flex flex-wrap gap-2 border-t pt-4">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button disabled={isPending}>
                <Check className="size-4" />
                {t("accept")}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>{t("acceptConfirmTitle")}</AlertDialogTitle>
                <AlertDialogDescription>
                  {t("acceptConfirmDescription", { name: applicant.firstName })}
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
          <Button
            variant="outline"
            onClick={() => handleStatusChange(ApplicationStatus.not_chosen)}
            disabled={isPending}
          >
            <X className="size-4" />
            {t("notChosen")}
          </Button>
        </div>
      )}
    </div>
  );
}
