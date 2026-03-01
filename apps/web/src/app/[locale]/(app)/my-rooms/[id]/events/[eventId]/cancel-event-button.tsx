"use client";

import { Loader2, X } from "lucide-react";
import { useRouter } from "@/i18n/navigation-app";
import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { toast } from "sonner";

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
import { Button } from "@/components/ui/button";

import { cancelEvent } from "../event-actions";

type Props = {
  eventId: string;
  roomId: string;
};

export function CancelEventButton({ eventId, roomId }: Props) {
  const t = useTranslations("app.rooms.events");
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleCancel() {
    startTransition(async () => {
      try {
        await cancelEvent(eventId, roomId);
        toast.success(t("cancelledSuccess"));
        setOpen(false);
        router.refresh();
      } catch {
        toast.error(t("cancelError"));
      }
    });
  }

  return (
    <>
      <Button variant="destructive" size="sm" onClick={() => setOpen(true)}>
        <X className="size-4" />
        {t("cancelEvent")}
      </Button>

      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("cancelConfirmTitle")}</AlertDialogTitle>
            <AlertDialogDescription>{t("cancelConfirmDescription")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("keepEvent")}</AlertDialogCancel>
            <AlertDialogAction onClick={handleCancel} disabled={isPending}>
              {isPending && <Loader2 className="animate-spin" />}
              {t("confirmCancel")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
