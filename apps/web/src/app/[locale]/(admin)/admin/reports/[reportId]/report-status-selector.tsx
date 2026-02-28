"use client";

import {REPORT_STATUSES} from "@openhospi/shared/enums";
import type {ReportStatus} from "@openhospi/shared/enums";
import {Check, ChevronsUpDown} from "lucide-react";
import {useTranslations} from "next-intl";
import {useState, useTransition} from "react";
import {toast} from "sonner";

import {Button} from "@/components/ui/button";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import {cn} from "@/lib/utils";

import {updateReportStatus} from "../../actions";

type Props = {
    reportId: string;
    currentStatus: ReportStatus;
};

export function ReportStatusSelector({reportId, currentStatus}: Props) {
    const t = useTranslations("admin.reports");
    const tEnums = useTranslations("enums");
    const [open, setOpen] = useState(false);
    const [isPending, startTransition] = useTransition();

    function handleStatusChange(newStatus: ReportStatus) {
        if (newStatus === currentStatus) {
            setOpen(false);
            return;
        }

        startTransition(async () => {
            try {
                await updateReportStatus(reportId, newStatus);
                toast.success(t("statusUpdated"));
                setOpen(false);
            } catch {
                toast.error(t("error"));
            }
        });
    }

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className="w-50 justify-between"
                    disabled={isPending}
                >
                    {tEnums(`report_status.${currentStatus}`)}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50"/>
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-50 p-0">
                <Command>
                    <CommandInput placeholder={t("searchStatus")}/>
                    <CommandList>
                        <CommandEmpty>{t("noStatusFound")}</CommandEmpty>
                        <CommandGroup>
                            {REPORT_STATUSES.map((status) => (
                                <CommandItem
                                    key={status}
                                    value={status}
                                    onSelect={() => handleStatusChange(status)}
                                >
                                    <Check
                                        className={cn(
                                            "mr-2 h-4 w-4",
                                            currentStatus === status ? "opacity-100" : "opacity-0"
                                        )}
                                    />
                                    {tEnums(`report_status.${status}`)}
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
}



