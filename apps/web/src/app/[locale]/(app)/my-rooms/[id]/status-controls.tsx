"use client";

import { RoomStatus } from "@openhospi/shared/enums";
import { Loader2, Pause, Play, Rocket, Trash2, XCircle } from "lucide-react";
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
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { useRouter } from "@/i18n/navigation-app";
import type { Room } from "@/lib/rooms";
import type { CloseRoomApplicant } from "@/lib/votes";

import { deleteRoom, updateRoomStatus } from "./actions";
import { CloseRoomDialog } from "./close-room-dialog";

type Props = {
  room: Room;
  closeApplicants?: CloseRoomApplicant[];
};

export function StatusControls({ room, closeApplicants = [] }: Props) {
  const t = useTranslations("app.rooms");
  const tCommon = useTranslations("common.labels");
  const tCommonErrors = useTranslations("common.errors");
  const [isPending, startTransition] = useTransition();
  const [closeOpen, setCloseOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const router = useRouter();

  function handleStatusChange(status: string) {
    startTransition(async () => {
      const result = await updateRoomStatus(room.id, status);
      if (result?.error) {
        if (result.error === "PROCESSING_RESTRICTED") {
          toast.error(tCommonErrors("processingRestricted"));
        } else {
          toast.error(t(`status.${result.error}`));
        }
        return;
      }
      let messageKey: "activated" | "paused" | "closed" = "closed";
      if (status === RoomStatus.active) messageKey = "activated";
      else if (status === RoomStatus.paused) messageKey = "paused";
      toast.success(t(`status.${messageKey}`));
      router.refresh();
    });
  }

  function handleDelete() {
    startTransition(async () => {
      await deleteRoom(room.id);
    });
  }

  if (room.status === RoomStatus.closed) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {room.status === RoomStatus.draft && (
        <>
          <Button onClick={() => handleStatusChange(RoomStatus.active)} disabled={isPending}>
            {isPending ? <Loader2 className="animate-spin" /> : <Rocket className="size-4" />}
            {t("actions.publish")}
          </Button>

          <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" disabled={isPending}>
                <Trash2 className="size-4" />
                {t("actions.deleteDraft")}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>{t("status.confirmDeleteTitle")}</AlertDialogTitle>
                <AlertDialogDescription>{t("status.confirmDelete")}</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>{tCommon("cancel")}</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDelete}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  {t("actions.deleteDraft")}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </>
      )}

      {room.status === RoomStatus.active && (
        <Button
          variant="outline"
          onClick={() => handleStatusChange(RoomStatus.paused)}
          disabled={isPending}
        >
          {isPending ? <Loader2 className="animate-spin" /> : <Pause className="size-4" />}
          {t("actions.pause")}
        </Button>
      )}

      {room.status === RoomStatus.paused && (
        <Button
          variant="outline"
          onClick={() => handleStatusChange(RoomStatus.active)}
          disabled={isPending}
        >
          {isPending ? <Loader2 className="animate-spin" /> : <Play className="size-4" />}
          {t("actions.activate")}
        </Button>
      )}

      {(room.status === RoomStatus.active || room.status === RoomStatus.paused) &&
        (closeApplicants.length > 0 ? (
          <CloseRoomDialog roomId={room.id} applicants={closeApplicants} />
        ) : (
          <AlertDialog open={closeOpen} onOpenChange={setCloseOpen}>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" disabled={isPending}>
                <XCircle className="size-4" />
                {t("actions.close")}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>{t("status.confirmCloseTitle")}</AlertDialogTitle>
                <AlertDialogDescription>{t("status.confirmClose")}</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>{tCommon("back")}</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => handleStatusChange(RoomStatus.closed)}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  {t("actions.close")}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        ))}
    </div>
  );
}
