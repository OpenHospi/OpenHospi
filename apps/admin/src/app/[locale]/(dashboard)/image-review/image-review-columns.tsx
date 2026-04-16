"use client";

import {
  STORAGE_BUCKET_PROFILE_PHOTOS,
  STORAGE_BUCKET_ROOM_PHOTOS,
} from "@openhospi/shared/constants";
import type { ColumnDef } from "@tanstack/react-table";
import Image from "next/image";
import { useFormatter, useTranslations } from "next-intl";

import { DataTableColumnHeader } from "@/components/data-table";
import { Badge } from "@/components/ui/badge";
import { getStoragePublicUrl } from "@/lib/supabase/storage-url";

import type { FlaggedPhoto } from "./actions";
import { ImageReviewActions } from "./image-review-actions";

export function useImageReviewColumns(): ColumnDef<FlaggedPhoto>[] {
  const t = useTranslations("admin.imageReview");
  const format = useFormatter();

  return [
    {
      accessorKey: "url",
      header: t("colPreview"),
      cell: ({ row }) => {
        const photo = row.original;
        const bucket =
          photo.type === "profile" ? STORAGE_BUCKET_PROFILE_PHOTOS : STORAGE_BUCKET_ROOM_PHOTOS;
        const fullUrl = getStoragePublicUrl(photo.url, bucket);
        return (
          <Image
            src={fullUrl}
            alt="Flagged content"
            width={80}
            height={80}
            className="rounded-md object-cover"
            unoptimized
          />
        );
      },
      enableSorting: false,
    },
    {
      accessorKey: "type",
      header: ({ column }) => <DataTableColumnHeader column={column} title={t("colType")} />,
      cell: ({ row }) => (
        <Badge variant={row.original.type === "profile" ? "default" : "secondary"}>
          {row.original.type === "profile" ? t("typeProfile") : t("typeRoom")}
        </Badge>
      ),
    },
    {
      accessorKey: "userName",
      header: ({ column }) => <DataTableColumnHeader column={column} title={t("colUploader")} />,
    },
    {
      accessorKey: "roomTitle",
      header: t("colRoom"),
      cell: ({ row }) => row.original.roomTitle ?? "—",
    },
    {
      accessorKey: "uploadedAt",
      header: ({ column }) => <DataTableColumnHeader column={column} title={t("colUploaded")} />,
      cell: ({ row }) =>
        format.dateTime(row.original.uploadedAt, {
          dateStyle: "medium",
          timeStyle: "short",
        }),
    },
    {
      id: "actions",
      header: t("colActions"),
      cell: ({ row }) => <ImageReviewActions photo={row.original} />,
    },
  ];
}
