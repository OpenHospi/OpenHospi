"use client";

import {INVITABLE_APPLICATION_STATUSES, ReviewDecision} from "@openhospi/shared/enums";
import {Check, Loader2, UserPlus} from "lucide-react";
import {useTranslations} from "next-intl";
import {useState, useTransition} from "react";
import {toast} from "sonner";

import {Badge} from "@/components/ui/badge";
import {Button} from "@/components/ui/button";
import {Checkbox} from "@/components/ui/checkbox";
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {useRouter} from "@/i18n/navigation-app";
import type {RoomApplicant} from "@/lib/applicants";
import {cn} from "@/lib/utils";

import {batchInviteApplicants} from "./invite-actions";

type Props = {
    eventId: string;
    roomId: string;
    applicants: RoomApplicant[];
};

export function InviteApplicantsDialog({eventId, roomId, applicants}: Props) {
    const t = useTranslations("app.rooms.invite");
    const tEnums = useTranslations("enums");
    const [open, setOpen] = useState(false);
    const [selected, setSelected] = useState<Set<string>>(new Set());
    const [isPending, startTransition] = useTransition();
    const router = useRouter();

    const invitable = applicants.filter((a) =>
        (INVITABLE_APPLICATION_STATUSES as readonly string[]).includes(a.status),
    );

    function toggleApplication(id: string) {
        setSelected((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    }

    function selectAllLiked() {
        const liked = invitable
            .filter((a) => a.reviews.some((r) => r.decision === ReviewDecision.like))
            .map((a) => a.applicationId);
        setSelected(new Set(liked));
    }

    function handleSubmit() {
        startTransition(async () => {
            const result = await batchInviteApplicants(eventId, roomId, [...selected]);
            if (result?.error) {
                toast.error(t("error"));
                return;
            }
            toast.success(t("success", {count: String(selected.size)}));
            setOpen(false);
            setSelected(new Set());
            router.refresh();
        });
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button size="sm" disabled={invitable.length === 0}>
                    <UserPlus className="size-4"/>
                    {t("inviteApplicants")}
                </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[80vh] overflow-y-auto sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>{t("title")}</DialogTitle>
                </DialogHeader>

                {invitable.length === 0 ? (
                    <p className="text-sm text-muted-foreground">{t("noInvitable")}</p>
                ) : (
                    <>
                        <div className="flex items-center justify-between">
                            <p className="text-sm text-muted-foreground">
                                {t("selected", {count: String(selected.size)})}
                            </p>
                            <Button variant="ghost" size="sm" onClick={selectAllLiked}>
                                <Check className="size-3.5"/>
                                {t("selectAllLiked")}
                            </Button>
                        </div>

                        <div className="divide-y rounded-lg border">
                            {invitable.map((applicant) => {
                                const likeCounts = {like: 0, maybe: 0, reject: 0};
                                for (const r of applicant.reviews) likeCounts[r.decision]++;

                                return (
                                    // eslint-disable-next-line jsx-a11y/label-has-associated-control -- Radix Checkbox renders as <button role="checkbox">, not a native <input>
                                    <label
                                        key={applicant.applicationId}
                                        className="flex cursor-pointer items-center gap-3 p-3 hover:bg-muted/50"
                                    >
                                        <Checkbox
                                            checked={selected.has(applicant.applicationId)}
                                            onCheckedChange={() => toggleApplication(applicant.applicationId)}
                                            aria-label={`${applicant.firstName} ${applicant.lastName}`}
                                        />
                                        <div className="min-w-0 flex-1">
                                            <p className="truncate text-sm font-medium">
                                                {applicant.firstName} {applicant.lastName}
                                            </p>
                                            <div className="flex gap-1.5 text-xs text-muted-foreground">
                                                {likeCounts.like > 0 && (
                                                    <Badge
                                                        variant="outline"
                                                        className={cn(
                                                            "h-5 text-[10px]",
                                                            "border-green-500 text-green-700 dark:text-green-400",
                                                        )}
                                                    >
                                                        {likeCounts.like} {tEnums("review_decision.like")}
                                                    </Badge>
                                                )}
                                                {likeCounts.maybe > 0 && (
                                                    <Badge
                                                        variant="outline"
                                                        className={cn(
                                                            "h-5 text-[10px]",
                                                            "border-yellow-500 text-yellow-700 dark:text-yellow-400",
                                                        )}
                                                    >
                                                        {likeCounts.maybe} {tEnums("review_decision.maybe")}
                                                    </Badge>
                                                )}
                                                {likeCounts.reject > 0 && (
                                                    <Badge
                                                        variant="outline"
                                                        className={cn(
                                                            "h-5 text-[10px]",
                                                            "border-red-500 text-red-700 dark:text-red-400",
                                                        )}
                                                    >
                                                        {likeCounts.reject} {tEnums("review_decision.reject")}
                                                    </Badge>
                                                )}
                                            </div>
                                        </div>
                                    </label>
                                );
                            })}
                        </div>
                    </>
                )}

                <DialogFooter>
                    <Button onClick={handleSubmit} disabled={isPending || selected.size === 0}>
                        {isPending && <Loader2 className="animate-spin"/>}
                        {t("submit", {count: String(selected.size)})}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
