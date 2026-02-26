"use client";

import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";

import { joinViaShareLink } from "./actions";

type Props = {
  code: string;
};

export function JoinButton({ code }: Props) {
  const t = useTranslations("app.join");
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleJoin() {
    startTransition(async () => {
      const result = await joinViaShareLink(code);
      if ("error" in result) {
        toast.error(t(`errors.${result.error}`));
        return;
      }
      toast.success(t("success"));
      router.push(`/my-rooms/${result.roomId}`);
    });
  }

  return (
    <Button onClick={handleJoin} disabled={isPending} className="w-full">
      {isPending && <Loader2 className="animate-spin" />}
      {t("joinButton")}
    </Button>
  );
}
