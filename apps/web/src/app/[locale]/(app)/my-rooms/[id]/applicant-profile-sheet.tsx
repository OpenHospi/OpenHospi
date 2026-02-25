"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { MAX_NOTES_LENGTH } from "@openhospi/shared/constants";
import { REVIEW_DECISIONS } from "@openhospi/shared/enums";
import { Loader2, UserCircle } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useMemo, useTransition } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import type { RoomApplicant } from "@/lib/applicants";
import type { ReviewData } from "@/lib/schemas/review";
import { reviewSchema } from "@/lib/schemas/review";

import { submitReview } from "./applicant-actions";

type Props = {
  applicant: RoomApplicant;
  roomId: string;
  currentUserId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function ApplicantProfileSheet({
  applicant,
  roomId,
  currentUserId,
  open,
  onOpenChange,
}: Props) {
  const t = useTranslations("app.rooms.applicants");
  const tEnums = useTranslations("enums");
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const myReview = applicant.reviews.find((r) => r.reviewer_id === currentUserId);

  const form = useForm<ReviewData>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(reviewSchema as any),
    defaultValues: {
      decision: myReview?.decision ?? undefined,
      notes: myReview?.notes ?? "",
    },
  });

  function onSubmit(data: ReviewData) {
    startTransition(async () => {
      const result = await submitReview(roomId, applicant.user_id, data);
      if (result?.error) {
        toast.error(t("reviewError"));
        return;
      }
      toast.success(t("reviewSubmitted"));
      router.refresh();
    });
  }

  const age = useMemo(() => {
    if (!applicant.birth_date) return null;
    return Math.floor(
      (new Date().getTime() - new Date(applicant.birth_date).getTime()) /
        (365.25 * 24 * 60 * 60 * 1000),
    );
  }, [applicant.birth_date]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="overflow-y-auto sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>
            {applicant.first_name} {applicant.last_name}
          </SheetTitle>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Profile photos */}
          {applicant.photos.length > 0 ? (
            <div className="grid grid-cols-2 gap-2">
              {applicant.photos.map((photo) => (
                <div
                  key={photo.id}
                  className="relative aspect-square overflow-hidden rounded-lg bg-muted"
                >
                  <Image
                    src={photo.url}
                    alt={photo.caption ?? applicant.first_name}
                    fill
                    className="object-cover"
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center rounded-lg bg-muted p-8">
              <UserCircle className="size-16 text-muted-foreground" />
            </div>
          )}

          {/* Basic info */}
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">
              {age && (
                <>
                  {age} {t("yearsOld")}
                </>
              )}
              {applicant.gender && <> · {tEnums(`gender.${applicant.gender}`)}</>}
            </p>
            {applicant.study_program && (
              <p className="text-sm">
                {applicant.study_program}
                {applicant.study_level && <> · {tEnums(`study_level.${applicant.study_level}`)}</>}
              </p>
            )}
            {applicant.vereniging && (
              <p className="text-sm text-muted-foreground">
                {tEnums(`vereniging.${applicant.vereniging}`)}
              </p>
            )}
            {applicant.show_instagram && applicant.instagram_handle && (
              <p className="text-sm text-muted-foreground">@{applicant.instagram_handle}</p>
            )}
          </div>

          {/* Bio */}
          {applicant.bio && (
            <div>
              <h3 className="text-sm font-semibold">{t("aboutThem")}</h3>
              <p className="mt-1 whitespace-pre-line text-sm text-muted-foreground">
                {applicant.bio}
              </p>
            </div>
          )}

          {/* Lifestyle tags */}
          {applicant.lifestyle_tags.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold">{t("lifestyle")}</h3>
              <div className="mt-1 flex flex-wrap gap-1">
                {applicant.lifestyle_tags.map((tag) => (
                  <Badge key={tag} variant="outline" className="text-xs">
                    {tEnums(`lifestyle_tag.${tag}`)}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Personal message */}
          {applicant.personal_message && (
            <div>
              <h3 className="text-sm font-semibold">{t("personalMessage")}</h3>
              <p className="mt-1 whitespace-pre-line text-sm italic text-muted-foreground">
                {applicant.personal_message}
              </p>
            </div>
          )}

          {/* Review form */}
          <div className="border-t pt-4">
            <h3 className="text-sm font-semibold">{t("yourReview")}</h3>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="mt-3 space-y-4">
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
                          {REVIEW_DECISIONS.map((d) => (
                            <label
                              key={d}
                              className="border-input has-data-[state=checked]:border-primary flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-sm"
                            >
                              <RadioGroupItem value={d} />
                              {tEnums(`review_decision.${d}`)}
                            </label>
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
                        <span className="font-normal text-muted-foreground">({t("optional")})</span>
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
        </div>
      </SheetContent>
    </Sheet>
  );
}
