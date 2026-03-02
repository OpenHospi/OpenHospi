"use client";

import { Loader2, XCircle } from "lucide-react";
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

import { withdrawApplication } from "./actions";

type Props = {
  applicationId: string;
};

export function WithdrawButton({ applicationId }: Props) {
  const t = useTranslations("app.applications");
  const tCommon = useTranslations("common.labels");
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleWithdraw() {
    startTransition(async () => {
      const result = await withdrawApplication(applicationId);
      if (result?.error) {
        toast.error(t(`errors.${result.error}` as Parameters<typeof t>[0]));
        return;
      }
      toast.success(t("withdrawSuccess"));
      setOpen(false);
      router.refresh();
    });
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button variant="destructive" disabled={isPending}>
          {isPending ? <Loader2 className="animate-spin" /> : <XCircle className="size-4" />}
          {t("withdraw")}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t("withdrawConfirmTitle")}</AlertDialogTitle>
          <AlertDialogDescription>{t("withdrawConfirmDescription")}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{tCommon("cancel")}</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleWithdraw}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {t("withdraw")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
