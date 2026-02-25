"use client";

import { Check, Copy, Loader2, RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Room } from "@/lib/rooms";

import { regenerateShareLink } from "./actions";

type Props = {
  room: Room;
};

export function ShareLinkSection({ room }: Props) {
  const t = useTranslations("app.rooms.shareLink");
  const [isPending, startTransition] = useTransition();
  const [copied, setCopied] = useState(false);
  const router = useRouter();

  const shareUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/room/${room.share_link}`;

  async function handleCopy() {
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    toast.success(t("copied"));
    setTimeout(() => setCopied(false), 2000);
  }

  function handleRegenerate() {
    if (!confirm(t("regenerateConfirm"))) return;
    startTransition(async () => {
      await regenerateShareLink(room.id);
      router.refresh();
    });
  }

  return (
    <div className="space-y-3">
      <h2 className="text-lg font-semibold">{t("title")}</h2>

      <div className="flex gap-2">
        <Input value={shareUrl} readOnly className="font-mono text-sm" />
        <Button variant="outline" size="icon" onClick={handleCopy}>
          {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
        </Button>
        <Button variant="outline" size="icon" onClick={handleRegenerate} disabled={isPending}>
          {isPending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <RefreshCw className="size-4" />
          )}
        </Button>
      </div>

      <div className="flex gap-4 text-sm text-muted-foreground">
        <span>{t("useCount", { count: room.share_link_use_count })}</span>
        <span>
          {room.share_link_max_uses ? `${t("maxUses")}: ${room.share_link_max_uses}` : t("noLimit")}
        </span>
        <span>
          {room.share_link_expires_at
            ? `${t("expiry")}: ${new Date(room.share_link_expires_at).toLocaleDateString()}`
            : t("noExpiry")}
        </span>
      </div>
    </div>
  );
}
