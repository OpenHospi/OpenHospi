"use client";

import type {ApplyToRoomData} from "@openhospi/database/validators";
import {applyToRoomSchema} from "@openhospi/database/validators";
import {
    MAX_PERSONAL_MESSAGE_LENGTH,
    MIN_PERSONAL_MESSAGE_LENGTH,
} from "@openhospi/shared/constants";
import {Loader2} from "lucide-react";
import {useTranslations} from "next-intl";
import {useState, useTransition} from "react";
import {useForm, useWatch} from "react-hook-form";
import {toast} from "sonner";

import {Button} from "@/components/ui/button";
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
import {Textarea} from "@/components/ui/textarea";
import {useRouter} from "@/i18n/navigation-app";
import {zodResolver} from "@/lib/form-utils";

import {applyToRoom} from "./actions";

type Props = {
    roomId: string;
};

export function ApplyDialog({roomId}: Props) {
    const t = useTranslations("app.roomDetail");
    const tCommon = useTranslations("common.labels");
    const [open, setOpen] = useState(false);
    const [isPending, startTransition] = useTransition();
    const router = useRouter();

    const form = useForm<ApplyToRoomData>({
        resolver: zodResolver(applyToRoomSchema),
        defaultValues: {personalMessage: ""},
    });

    const messageLength = useWatch({control: form.control, name: "personalMessage"})?.length ?? 0;

    function onSubmit(data: ApplyToRoomData) {
        startTransition(async () => {
            const result = await applyToRoom(roomId, data);
            if (result?.error) {
                toast.error(t(`errors.${result.error}` as Parameters<typeof t>[0]));
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

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="personalMessage"
                            render={({field}) => (
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
                                        <FormMessage/>
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
                                {isPending && <Loader2 className="animate-spin"/>}
                                {t("submitApplication")}
                            </Button>
                        </div>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
