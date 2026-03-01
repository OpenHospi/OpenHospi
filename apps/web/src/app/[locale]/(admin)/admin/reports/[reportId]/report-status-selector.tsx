"use client";

import { ReportStatus } from "@openhospi/shared/enums";
import { useTranslations } from "next-intl";
import { useTransition } from "react";
import { toast } from "sonner";

import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox";

import { updateReportStatus } from "../../actions";

type Props = {
  reportId: string;
  currentStatus: ReportStatus;
};

export function ReportStatusSelector({ reportId, currentStatus }: Props) {
  const t = useTranslations("admin.reports");
  const tEnums = useTranslations("enums");
  const [isPending, startTransition] = useTransition();

  function handleStatusChange(newStatus: string | null) {
    if (!newStatus || newStatus === currentStatus) return;

    startTransition(async () => {
      try {
        await updateReportStatus(reportId, newStatus as ReportStatus);
        toast.success(t("statusUpdated"));
      } catch {
        toast.error(t("error"));
      }
    });
  }

  return (
    <Combobox
      value={currentStatus}
      onValueChange={handleStatusChange}
      items={ReportStatus.values}
      itemToStringLabel={(s) => tEnums(`report_status.${s}`)}
    >
      <ComboboxInput className="w-50" placeholder={t("searchStatus")} disabled={isPending} />
      <ComboboxContent>
        <ComboboxEmpty>{t("noStatusFound")}</ComboboxEmpty>
        <ComboboxList>
          {(status) => (
            <ComboboxItem key={status} value={status}>
              {tEnums(`report_status.${status}`)}
            </ComboboxItem>
          )}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  );
}
