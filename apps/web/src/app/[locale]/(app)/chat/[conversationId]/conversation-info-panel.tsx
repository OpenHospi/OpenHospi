"use client";

import type { FingerprintResult } from "@openhospi/crypto";
import { Flag, Lock, Shield, ShieldBan, ShieldCheck, X } from "lucide-react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { SafetyNumberDialog } from "@/components/app/safety-number-dialog";
import { ReportDialog } from "@/components/shared/report-dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Link } from "@/i18n/navigation-app";
import type { ConversationDetail } from "@/lib/queries/chat";

type Props = {
  open: boolean;
  onClose: () => void;
  conversationDetail: ConversationDetail;
  currentUserId: string;
  blockedUserIds: string[];
  onBlock: (userId: string) => void;
  onUnblock: (userId: string) => void;
  getFingerprint: (userId: string) => Promise<FingerprintResult | null>;
};

function MemberRow({
  member,
  currentUserId,
  isBlocked,
  onBlock,
  onUnblock,
  getFingerprint,
}: {
  member: ConversationDetail["members"][number];
  currentUserId: string;
  isBlocked: boolean;
  onBlock: (userId: string) => void;
  onUnblock: (userId: string) => void;
  getFingerprint: (userId: string) => Promise<FingerprintResult | null>;
}) {
  const t = useTranslations("app.chat");
  const [safetyOpen, setSafetyOpen] = useState(false);

  if (member.userId === currentUserId) return null;

  const initials = `${member.firstName[0] ?? ""}${member.lastName[0] ?? ""}`.toUpperCase();

  return (
    <div className="flex items-center gap-3 py-2">
      <Avatar>
        <AvatarImage src={member.avatarUrl ?? undefined} alt={member.firstName} />
        <AvatarFallback>{initials}</AvatarFallback>
      </Avatar>

      <span className="min-w-0 flex-1 truncate text-sm font-medium">
        {member.firstName} {member.lastName}
      </span>

      <div className="flex shrink-0 items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          className="size-8"
          onClick={() => setSafetyOpen(true)}
          title={t("verify_identity")}
        >
          <Shield className="size-4" />
        </Button>

        {isBlocked ? (
          <Button
            variant="ghost"
            size="icon"
            className="size-8"
            onClick={() => onUnblock(member.userId)}
            title={t("unblock_user")}
          >
            <ShieldCheck className="size-4 text-green-600" />
          </Button>
        ) : (
          <Button
            variant="ghost"
            size="icon"
            className="size-8"
            onClick={() => onBlock(member.userId)}
            title={t("block_user")}
          >
            <ShieldBan className="size-4" />
          </Button>
        )}

        <ReportDialog
          type="user"
          targetId={member.userId}
          trigger={
            <Button
              variant="ghost"
              size="icon"
              className="size-8"
              title={t("report_user", { name: member.firstName })}
            >
              <Flag className="size-4" />
            </Button>
          }
        />
      </div>

      <SafetyNumberDialog
        open={safetyOpen}
        onOpenChange={setSafetyOpen}
        otherUserName={member.firstName}
        getFingerprint={() => getFingerprint(member.userId)}
      />
    </div>
  );
}

export function ConversationInfoPanel({
  open,
  onClose,
  conversationDetail,
  currentUserId,
  blockedUserIds,
  onBlock,
  onUnblock,
  getFingerprint,
}: Props) {
  const t = useTranslations("app.chat");

  const isSeeker = currentUserId === conversationDetail.seekerUserId;
  const otherMembers = conversationDetail.members.filter((m) => m.userId !== currentUserId);
  const houseMembers = conversationDetail.members.filter((m) => m.role === "house_member");
  const seekerMember = conversationDetail.members.find((m) => m.role === "seeker");

  return (
    <>
      {/* Backdrop */}
      {open && (
        <div className="absolute inset-0 z-20 bg-black/20" onClick={onClose} aria-hidden="true" />
      )}

      {/* Panel */}
      <div
        className={`absolute inset-y-0 right-0 z-30 flex w-80 flex-col bg-background shadow-xl transition-transform duration-300 ease-in-out ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
        aria-label={t("group_info")}
      >
        {/* Panel Header */}
        <div className="flex shrink-0 items-center justify-between border-b px-4 py-3">
          <h3 className="font-semibold">{t("group_info")}</h3>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="size-4" />
          </Button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto">
          {/* Room Card */}
          {conversationDetail.room && (
            <div className="p-4">
              <Link href={`/discover/${conversationDetail.room.id}`} className="block">
                <div className="bg-muted overflow-hidden rounded-lg border transition-opacity hover:opacity-80">
                  {conversationDetail.room.coverPhotoUrl && (
                    <div className="relative h-32 w-full">
                      <Image
                        src={conversationDetail.room.coverPhotoUrl}
                        alt={conversationDetail.room.title}
                        fill
                        className="object-cover"
                      />
                    </div>
                  )}
                  <div className="p-3">
                    <p className="truncate font-medium text-sm">{conversationDetail.room.title}</p>
                    <p className="text-muted-foreground text-xs">{conversationDetail.room.city}</p>
                    <p className="mt-1 text-sm font-semibold">
                      €{Number(conversationDetail.room.rentPrice).toLocaleString()}
                    </p>
                  </div>
                </div>
              </Link>
            </div>
          )}

          <Separator />

          {/* Members Section */}
          <div className="p-4">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {isSeeker ? t("house_members") : t("all_members")}
            </p>

            <div className="space-y-0.5">
              {isSeeker
                ? houseMembers.map((member) => (
                    <MemberRow
                      key={member.userId}
                      member={member}
                      currentUserId={currentUserId}
                      isBlocked={blockedUserIds.includes(member.userId)}
                      onBlock={onBlock}
                      onUnblock={onUnblock}
                      getFingerprint={getFingerprint}
                    />
                  ))
                : otherMembers.map((member) => (
                    <MemberRow
                      key={member.userId}
                      member={member}
                      currentUserId={currentUserId}
                      isBlocked={blockedUserIds.includes(member.userId)}
                      onBlock={onBlock}
                      onUnblock={onUnblock}
                      getFingerprint={getFingerprint}
                    />
                  ))}
            </div>
          </div>

          {/* Seeker info for house members */}
          {!isSeeker && seekerMember && (
            <>
              <Separator />
              <div className="p-4">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {t("seeker_info")}
                </p>
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarImage
                      src={seekerMember.avatarUrl ?? undefined}
                      alt={seekerMember.firstName}
                    />
                    <AvatarFallback>
                      {`${seekerMember.firstName[0] ?? ""}${seekerMember.lastName[0] ?? ""}`.toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm font-medium">
                    {seekerMember.firstName} {seekerMember.lastName}
                  </span>
                </div>
              </div>
            </>
          )}
        </div>

        {/* E2E Badge */}
        <div className="shrink-0 border-t p-4">
          <div className="flex items-center justify-center gap-2 text-muted-foreground">
            <Lock className="size-3.5 shrink-0" />
            <p className="text-xs">{t("e2e_info")}</p>
          </div>
        </div>
      </div>
    </>
  );
}
