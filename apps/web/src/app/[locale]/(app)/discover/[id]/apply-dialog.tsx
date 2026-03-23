"use client";

import {
  MAX_PERSONAL_MESSAGE_LENGTH,
  MIN_PERSONAL_MESSAGE_LENGTH,
} from "@openhospi/shared/constants";
import { ApplicationError, CommonError } from "@openhospi/shared/error-codes";
import type { ApplyToRoomData } from "@openhospi/validators";
import { applyToRoomSchema } from "@openhospi/validators";
import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Link, useRouter } from "@/i18n/navigation-app";
import { zodResolver } from "@/lib/form-utils";

import { applyToRoom } from "./actions";

type Props = {
  roomId: string;
};

export function ApplyDialog({ roomId }: Props) {
  const t = useTranslations("app.roomDetail");
  const tCommon = useTranslations("common.labels");
  const tCommonErrors = useTranslations("common.errors");
  const [open, setOpen] = useState(false);
  const [bioRequired, setBioRequired] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const form = useForm<ApplyToRoomData>({
    resolver: zodResolver(applyToRoomSchema),
    defaultValues: { personalMessage: "" },
  });

  const messageLength = useWatch({ control: form.control, name: "personalMessage" })?.length ?? 0;

  function onSubmit(data: ApplyToRoomData) {
    startTransition(async () => {
      const result = await applyToRoom(roomId, data);
      if (result?.error) {
        if (result.error === ApplicationError.bio_required) {
          setBioRequired(true);
          return;
        }
        if (result.error === CommonError.processing_restricted) {
          toast.error(tCommonErrors("processingRestricted"));
        } else {
          toast.error(t(`errors.${result.error}`));
        }
        return;
      }
      toast.success(t("applySuccess"));
      setOpen(false);
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="w-full">{t("apply")}</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("applyTitle")}</DialogTitle>
        </DialogHeader>

        {bioRequired ? (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">{t("errors.bio_required")}</p>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                {tCommon("cancel")}
              </Button>
              <Button asChild>
                <Link href="/profile">{t("goToProfile")}</Link>
              </Button>
            </div>
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="personalMessage"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("personalMessage")}</FormLabel>
                    <FormControl>
                      <Textarea
                        className="min-h-32 resize-none"
                        placeholder={t("personalMessagePlaceholder")}
                        {...field}
                      />
                    </FormControl>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <FormMessage />
                      <span className="ml-auto">
                        {messageLength}/{MAX_PERSONAL_MESSAGE_LENGTH}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {t("personalMessageHint", {
                        min: String(MIN_PERSONAL_MESSAGE_LENGTH),
                      })}
                    </p>
                  </FormItem>
                )}
              />

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                  {tCommon("cancel")}
                </Button>
                <Button type="submit" disabled={isPending}>
                  {isPending && <Loader2 className="animate-spin" />}
                  {t("submitApplication")}
                </Button>
              </div>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
}
