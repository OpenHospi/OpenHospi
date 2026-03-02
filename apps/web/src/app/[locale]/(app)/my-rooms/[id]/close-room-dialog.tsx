"use client";

import { Loader2, UserCircle, XCircle } from "lucide-react";
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useRouter } from "@/i18n/navigation-app";
import { cn } from "@/lib/utils";

import { closeRoomWithChoice } from "./close-room-actions";

type Applicant = {
  applicationId: string;
  userId: string;
  firstName: string;
  lastName: string;
  avatarUrl: string | null;
  totalRank: number | null;
};

type Props = {
  roomId: string;
  applicants: Applicant[];
};

export function CloseRoomDialog({ roomId, applicants }: Props) {
  const t = useTranslations("app.rooms.closeRoom");
  const tCommon = useTranslations("common.labels");
  const tActions = useTranslations("app.rooms.actions");
  const [open, setOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | undefined>(undefined);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleClose() {
    setConfirmOpen(true);
  }

  function handleConfirm() {
    startTransition(async () => {
      try {
        await closeRoomWithChoice(roomId, selectedId);
        toast.success(t("success"));
        setOpen(false);
        setConfirmOpen(false);
        router.refresh();
      } catch {
        toast.error(t("error"));
      }
    });
  }

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button variant="destructive" size="sm">
            <XCircle className="size-4" />
            {tActions("close")}
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("title")}</DialogTitle>
            <DialogDescription>{t("description")}</DialogDescription>
          </DialogHeader>

          {applicants.length > 0 ? (
            <div className="space-y-2">
              <p className="text-sm font-medium">{t("chooseApplicant")}</p>
              <div className="max-h-64 space-y-1 overflow-y-auto">
                {applicants.map((a) => (
                  <button
                    key={a.applicationId}
                    type="button"
                    className={cn(
                      "flex w-full items-center gap-3 rounded-lg border p-3 text-left transition-colors",
                      selectedId === a.applicationId
                        ? "border-primary bg-primary/5"
                        : "hover:bg-muted/50",
                    )}
                    onClick={() =>
                      setSelectedId(selectedId === a.applicationId ? undefined : a.applicationId)
                    }
                  >
                    <Avatar>
                      {a.avatarUrl ? (
                        <AvatarImage src={a.avatarUrl} alt={a.firstName} />
                      ) : (
                        <AvatarFallback>
                          <UserCircle className="size-5" />
                        </AvatarFallback>
                      )}
                    </Avatar>
                    <span className="flex-1 text-sm font-medium">
                      {a.firstName} {a.lastName}
                    </span>
                    {a.totalRank != null && (
                      <span className="text-xs text-muted-foreground">
                        {t("rankScore", { score: String(a.totalRank) })}
                      </span>
                    )}
                  </button>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">{t("chooseHint")}</p>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">{t("noApplicants")}</p>
          )}

          <DialogFooter>
            <Button variant="destructive" onClick={handleClose} disabled={isPending}>
              {isPending && <Loader2 className="animate-spin" />}
              {selectedId ? t("closeWithChoice") : t("closeWithoutChoice")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("confirmTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {selectedId ? t("confirmWithChoice") : t("confirmWithoutChoice")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>{tCommon("cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirm}
              disabled={isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isPending && <Loader2 className="animate-spin" />}
              {t("confirm")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
