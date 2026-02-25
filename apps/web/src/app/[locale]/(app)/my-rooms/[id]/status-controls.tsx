"use client";

import { Loader2, Pause, Play, XCircle } from "lucide-react";
import { useRouter } from "next/navigation";
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
import type { Room } from "@/lib/rooms";

import { updateRoomStatus } from "./actions";

type Props = {
  room: Room;
};

export function StatusControls({ room }: Props) {
  const t = useTranslations("app.rooms");
  const [isPending, startTransition] = useTransition();
  const [closeOpen, setCloseOpen] = useState(false);
  const router = useRouter();

  function handleStatusChange(status: string) {
    startTransition(async () => {
      const result = await updateRoomStatus(room.id, status);
      if (result?.error) {
        toast.error(t(`status.${result.error}`));
        return;
      }
      let messageKey = "closed";
      if (status === "active") messageKey = "activated";
      else if (status === "paused") messageKey = "paused";
      toast.success(t(`status.${messageKey}`));
      router.refresh();
    });
  }

  if (room.status === "closed") return null;

  return (
    <div className="flex flex-wrap gap-2">
      {room.status === "active" && (
        <Button variant="outline" onClick={() => handleStatusChange("paused")} disabled={isPending}>
          {isPending ? <Loader2 className="animate-spin" /> : <Pause className="size-4" />}
          {t("actions.pause")}
        </Button>
      )}

      {room.status === "paused" && (
        <Button variant="outline" onClick={() => handleStatusChange("active")} disabled={isPending}>
          {isPending ? <Loader2 className="animate-spin" /> : <Play className="size-4" />}
          {t("actions.activate")}
        </Button>
      )}

      {(room.status === "active" || room.status === "paused") && (
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
              <AlertDialogCancel>{t("actions.back")}</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => handleStatusChange("closed")}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {t("actions.close")}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
}
