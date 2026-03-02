"use client";

import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { useRouter } from "@/i18n/navigation-app";

import { joinHouse } from "./actions";

type Props = {
  code: string;
};

export function JoinHouseButton({ code }: Props) {
  const t = useTranslations("app.joinHouse");
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleJoin() {
    startTransition(async () => {
      const result = await joinHouse(code);
      if ("error" in result && result.error) {
        toast.error(t(`errors.${result.error}`));
        return;
      }
      toast.success(t("success"));
      router.push("/my-house");
    });
  }

  return (
    <Button onClick={handleJoin} disabled={isPending} className="w-full">
      {isPending && <Loader2 className="animate-spin" />}
      {t("joinButton")}
    </Button>
  );
}
