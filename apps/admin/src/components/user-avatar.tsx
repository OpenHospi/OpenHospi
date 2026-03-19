"use client";

import { STORAGE_BUCKET_PROFILE_PHOTOS } from "@openhospi/shared/constants";

import { StorageImage } from "@/components/storage-image";
import { cn } from "@/lib/utils";

type UserAvatarProps = {
  avatarUrl: string | null | undefined;
  userName: string;
  size?: "sm" | "md" | "lg";
  className?: string;
};

const sizeClasses = {
  sm: "size-8 text-xs",
  md: "size-10 text-sm",
  lg: "size-16 text-lg",
};

export function UserAvatar({ avatarUrl, userName, size = "md", className }: UserAvatarProps) {
  const getInitials = (name: string): string => {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.charAt(0).toUpperCase();
  };

  const initials = getInitials(userName);
  const hasValidAvatar = avatarUrl && avatarUrl.trim().length > 0;

  return hasValidAvatar ? (
    <div
      className={cn("relative shrink-0 overflow-hidden rounded-full", sizeClasses[size], className)}
    >
      <StorageImage
        src={avatarUrl}
        alt={userName}
        bucket={STORAGE_BUCKET_PROFILE_PHOTOS}
        fill
        className="object-cover"
      />
    </div>
  ) : (
    <div
      className={cn(
        "bg-primary/10 flex shrink-0 items-center justify-center rounded-full font-semibold text-primary",
        sizeClasses[size],
        className,
      )}
    >
      {initials}
    </div>
  );
}
