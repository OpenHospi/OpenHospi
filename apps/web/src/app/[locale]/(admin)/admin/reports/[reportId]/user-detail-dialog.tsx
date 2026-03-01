"use client";

import { useTranslations } from "next-intl";

import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { InstitutionBadge } from "@/components/app/institution-badge";
import { UserAvatar } from "@/components/user-avatar";

import type { UserDetail } from "../../actions";

type Props = {
  user: UserDetail;
  children: React.ReactNode;
};

export function UserDetailDialog({ user, children }: Props) {
  const t = useTranslations("admin.reports");
  const tCommon = useTranslations("common.labels");

  return (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("userDetails")}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <UserAvatar avatarUrl={user.avatarUrl} userName={user.name} size="lg" />
            <div>
              <p className="font-medium">
                {user.name}
                {user.banned && (
                  <Badge variant="destructive" className="ml-2">
                    {t("banned")}
                  </Badge>
                )}
              </p>
              <p className="text-muted-foreground text-sm">{user.email}</p>
            </div>
          </div>
          {/* ...existing code... */}
          <div className="space-y-3">
            <div>
              <p className="text-muted-foreground text-sm">{tCommon("institution")}</p>
              <InstitutionBadge domain={user.institutionDomain} />
            </div>
            {user.studyProgram && (
              <div>
                <p className="text-muted-foreground text-sm">{tCommon("studyProgramme")}</p>
                <p className="font-medium">{user.studyProgram}</p>
              </div>
            )}
            {user.bio && (
              <div>
                <p className="text-muted-foreground text-sm">{tCommon("bio")}</p>
                <p className="mt-1 whitespace-pre-wrap text-sm">{user.bio}</p>
              </div>
            )}
            <div>
              <p className="text-muted-foreground text-sm">{tCommon("memberSince")}</p>
              <p className="font-medium">{user.createdAt.toLocaleDateString()}</p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
