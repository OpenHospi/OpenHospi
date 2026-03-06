"use client";

import { Loader2, Monitor, Smartphone, Trash2 } from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";
import { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useRouter } from "@/i18n/navigation-app";
import { authClient } from "@/lib/auth/client";

import { deleteAccount } from "./actions";

type SessionInfo = {
  token: string;
  userAgent?: string | null;
  createdAt: Date;
  current?: boolean;
};

export function AccountSettings() {
  const t = useTranslations("app.settings");
  const tCommon = useTranslations("common.labels");
  const format = useFormatter();
  const router = useRouter();
  const [isDeleting, startDelete] = useTransition();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const [sessions, setSessions] = useState<SessionInfo[]>([]);
  const [isRevokingSession, startRevokeSession] = useTransition();

  useEffect(() => {
    authClient.listSessions().then(({ data }) => {
      if (data) setSessions(data as unknown as SessionInfo[]);
    });
  }, []);

  function handleRevokeSession(token: string) {
    startRevokeSession(async () => {
      await authClient.revokeSession({ token });
      setSessions(sessions.filter((s) => s.token !== token));
      toast.success(t("account.sessions.revoked"));
    });
  }

  function handleDelete() {
    startDelete(async () => {
      await deleteAccount();
      router.push("/");
    });
  }

  return (
    <div className="space-y-6">
      {/* Active sessions */}
      <Card>
        <CardHeader>
          <CardTitle>{t("account.sessions.title")}</CardTitle>
          <CardDescription>{t("account.sessions.description")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {sessions.length === 0 ? (
            <p className="text-muted-foreground text-sm">{t("account.sessions.empty")}</p>
          ) : (
            sessions.map((session) => {
              const isMobile = session.userAgent
                ? /mobile|android|iphone/i.test(session.userAgent)
                : false;
              return (
                <div
                  key={session.token}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div className="flex items-center gap-3">
                    {isMobile ? (
                      <Smartphone className="text-muted-foreground size-4" />
                    ) : (
                      <Monitor className="text-muted-foreground size-4" />
                    )}
                    <div className="space-y-0.5">
                      <p className="text-sm font-medium">
                        {session.current
                          ? t("account.sessions.current")
                          : t("account.sessions.lastActive", {
                              date: format.dateTime(new Date(session.createdAt), "short"),
                            })}
                      </p>
                    </div>
                  </div>
                  {!session.current && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRevokeSession(session.token)}
                      disabled={isRevokingSession}
                    >
                      {t("account.sessions.revokeButton")}
                    </Button>
                  )}
                </div>
              );
            })
          )}
        </CardContent>
      </Card>

      {/* Danger zone */}
      <Card className="border-destructive">
        <CardHeader>
          <CardTitle className="text-destructive">{t("dangerZone.title")}</CardTitle>
          <CardDescription>{t("dangerZone.description")}</CardDescription>
        </CardHeader>
        <CardContent>
          <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
            <AlertDialogTrigger asChild>
              <Button variant="destructive">
                <Trash2 className="size-4" />
                {t("dangerZone.deleteButton")}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>{t("dangerZone.confirmTitle")}</AlertDialogTitle>
                <AlertDialogDescription>
                  {t("dangerZone.confirmDescription")}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>{tCommon("cancel")}</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  {isDeleting && <Loader2 className="animate-spin" />}
                  {t("dangerZone.confirmDelete")}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardContent>
      </Card>
    </div>
  );
}
