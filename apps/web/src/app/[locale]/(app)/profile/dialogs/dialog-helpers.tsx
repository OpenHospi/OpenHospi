"use client";

import type { EditProfileData } from "@openhospi/validators";
import type { LifestyleTag, Language } from "@openhospi/shared/enums";
import { Loader2, Pencil } from "lucide-react";
import { useTranslations } from "next-intl";
import type { ReactNode } from "react";
import { useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import type { ProfileWithPhotos } from "@/lib/queries/profile";
import { cn } from "@/lib/utils";

import { updateProfile } from "../profile-actions";

export type CardProps = {
  profile: ProfileWithPhotos;
};

type SectionCardProps = {
  title: string;
  onEdit: () => void;
  children: ReactNode;
  className?: string;
};

export function SectionCard({ title, onEdit, children, className }: SectionCardProps) {
  const tCommon = useTranslations("common.labels");
  return (
    <div className={cn("rounded-xl border bg-card p-5 text-card-foreground shadow-sm", className)}>
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-base font-semibold">{title}</h3>
        <Button variant="ghost" size="icon" className="size-8" onClick={onEdit}>
          <Pencil className="size-3.5" />
          <span className="sr-only">{tCommon("edit")}</span>
        </Button>
      </div>
      {children}
    </div>
  );
}

export function profileToFormDefaults(profile: ProfileWithPhotos): EditProfileData {
  return {
    gender: (profile.gender as EditProfileData["gender"]) ?? undefined,
    birthDate: profile.birthDate ?? "",
    studyProgram: profile.studyProgram ?? "",
    studyLevel: (profile.studyLevel as EditProfileData["studyLevel"]) ?? undefined,
    bio: profile.bio ?? "",
    lifestyleTags: (profile.lifestyleTags as LifestyleTag[]) ?? [],
    languages: (profile.languages as Language[]) ?? [],
    preferredCity: (profile.preferredCity as EditProfileData["preferredCity"]) ?? undefined,
    vereniging: (profile.vereniging as EditProfileData["vereniging"]) ?? undefined,
  };
}

export function useSectionSubmit(profile: ProfileWithPhotos, onSuccess: () => void) {
  const t = useTranslations("app.profile");
  const [isPending, startTransition] = useTransition();

  function submit(data: Partial<EditProfileData>) {
    startTransition(async () => {
      const full = { ...profileToFormDefaults(profile), ...data };
      const result = await updateProfile(full);
      if (result?.error) {
        toast.error(result.error);
        return;
      }
      toast.success(t("editSuccess"));
      onSuccess();
    });
  }

  return { isPending, submit };
}

type DialogFooterProps = {
  isPending: boolean;
  onCancel: () => void;
};

export function DialogFooter({ isPending, onCancel }: DialogFooterProps) {
  const tCommon = useTranslations("common.labels");
  return (
    <div className="flex justify-end gap-2 pt-2">
      <Button type="button" variant="outline" onClick={onCancel}>
        {tCommon("cancel")}
      </Button>
      <Button type="submit" disabled={isPending}>
        {isPending && <Loader2 className="animate-spin" />}
        {tCommon("save")}
      </Button>
    </div>
  );
}
