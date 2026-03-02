"use client";

import { ConsentPurpose, DataRequestType } from "@openhospi/shared/enums";
import {
  Download,
  FileSpreadsheet,
  History,
  Loader2,
  Monitor,
  Send,
  Shield,
  ShieldOff,
  Smartphone,
  Trash2,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";

import { PushNotificationManager } from "@/components/app/push-notification-manager";
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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useRouter } from "@/i18n/navigation-app";
import { authClient } from "@/lib/auth-client";

import { deleteAccount, exportData, exportDataCSV } from "./actions";
import {
  getActiveConsents,
  getConsentHistory,
  getProcessingRestriction,
  liftProcessingRestriction,
  requestProcessingRestriction,
  submitDataRequest,
  updateConsent,
} from "./privacy-actions";

export function SettingsContent() {
  const t = useTranslations("app.settings");
  const tConsent = useTranslations("app.consent");
  const tCommon = useTranslations("common.labels");
  const router = useRouter();
  const [isExporting, startExport] = useTransition();
  const [isDeleting, startDelete] = useTransition();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  // Privacy state
  const [consents, setConsents] = useState<Record<string, boolean>>({});
  const [isRestricted, setIsRestricted] = useState(false);
  const [restrictionReason, setRestrictionReason] = useState("");
  const [isRestricting, startRestriction] = useTransition();

  // Data request state
  const [requestType, setRequestType] = useState<DataRequestType | "">("");
  const [requestDescription, setRequestDescription] = useState("");
  const [isSubmittingRequest, startSubmitRequest] = useTransition();

  // Consent history state
  const [consentHistoryRecords, setConsentHistoryRecords] = useState<
    { purpose: string; granted: boolean; createdAt: Date }[]
  >([]);
  const [showHistory, setShowHistory] = useState(false);

  // CSV export state
  const [isExportingCSV, startExportCSV] = useTransition();

  // Sessions state
  type SessionInfo = {
    token: string;
    userAgent?: string | null;
    createdAt: Date;
    current?: boolean;
  };
  const [sessions, setSessions] = useState<SessionInfo[]>([]);
  const [isRevokingSession, startRevokeSession] = useTransition();

  useEffect(() => {
    getActiveConsents().then((records) => {
      const map: Record<string, boolean> = {};
      for (const r of records) map[r.purpose] = r.granted;
      setConsents(map);
    });
    getProcessingRestriction().then((r) => setIsRestricted(r !== null));
    authClient.listSessions().then(({ data }) => {
      if (data) setSessions(data as unknown as SessionInfo[]);
    });
  }, []);

  function handleExport() {
    startExport(async () => {
      const result = await exportData();

      const blob = new Blob([JSON.stringify(result.data, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `openhospi-data-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success(t("exportSuccess"));
    });
  }

  function handleExportCSV() {
    startExportCSV(async () => {
      const result = await exportDataCSV();
      if ("error" in result) return;
      const { csvFiles } = result as { csvFiles: Record<string, string> };
      if (!csvFiles) return;

      // Download each CSV as a separate file
      for (const [filename, content] of Object.entries(csvFiles)) {
        const blob = new Blob([content], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
      }
      toast.success(t("exportSuccess"));
    });
  }

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

  function handleConsentToggle(purpose: ConsentPurpose, granted: boolean) {
    setConsents((prev) => ({ ...prev, [purpose]: granted }));
    updateConsent(purpose, granted);
  }

  function handleSubmitDataRequest() {
    if (!requestType || requestDescription.length < 10) return;
    startSubmitRequest(async () => {
      await submitDataRequest({
        type: requestType as DataRequestType,
        description: requestDescription,
      });
      setRequestType("");
      setRequestDescription("");
      toast.success(t("privacy.dataRequest.success"));
    });
  }

  async function handleShowHistory() {
    if (!showHistory) {
      const records = await getConsentHistory();
      setConsentHistoryRecords(records);
    }
    setShowHistory((prev) => !prev);
  }

  function handleRestriction() {
    if (isRestricted) {
      startRestriction(async () => {
        await liftProcessingRestriction();
        setIsRestricted(false);
        toast.success(t("privacy.processingRestriction.liftSuccess"));
      });
    } else {
      if (restrictionReason.length < 10) return;
      startRestriction(async () => {
        await requestProcessingRestriction({ reason: restrictionReason });
        setIsRestricted(true);
        setRestrictionReason("");
        toast.success(t("privacy.processingRestriction.activateSuccess"));
      });
    }
  }

  return (
    <Tabs defaultValue="general" className="space-y-6">
      <TabsList>
        <TabsTrigger value="general">{t("tabs.general")}</TabsTrigger>
        <TabsTrigger value="privacy">{t("tabs.privacy")}</TabsTrigger>
        <TabsTrigger value="account">{t("tabs.account")}</TabsTrigger>
      </TabsList>

      {/* ── General tab ── */}
      <TabsContent value="general" className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>{t("pushNotifications.title")}</CardTitle>
            <CardDescription>{t("pushNotifications.description")}</CardDescription>
          </CardHeader>
          <CardContent>
            <PushNotificationManager />
          </CardContent>
        </Card>
      </TabsContent>

      {/* ── Privacy tab ── */}
      <TabsContent value="privacy" className="space-y-6">
        {/* Consent management */}
        <Card>
          <CardHeader>
            <CardTitle>{t("privacy.consentManagement.title")}</CardTitle>
            <CardDescription>{t("privacy.consentManagement.description")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {ConsentPurpose.values.map((purpose) => {
              const isEssential = purpose === ConsentPurpose.essential;
              return (
                <div key={purpose} className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <p className="text-sm font-medium">{tConsent(`purposes.${purpose}.name`)}</p>
                    <p className="text-xs text-muted-foreground">
                      {tConsent(`purposes.${purpose}.description`)}
                    </p>
                  </div>
                  <Switch
                    checked={isEssential ? true : (consents[purpose] ?? false)}
                    disabled={isEssential}
                    onCheckedChange={(checked) => handleConsentToggle(purpose, checked)}
                  />
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Data overview */}
        <Card>
          <CardHeader>
            <CardTitle>{t("privacy.dataOverview.title")}</CardTitle>
            <CardDescription>{t("privacy.dataOverview.description")}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {(
                [
                  "profile",
                  "photos",
                  "housing",
                  "applications",
                  "chat",
                  "sessions",
                  "moderation",
                ] as const
              ).map((cat) => {
                const isLegitimateInterest = cat === "sessions" || cat === "moderation";
                const legalBasis = isLegitimateInterest
                  ? t("privacy.dataOverview.legitimateInterest")
                  : t("privacy.dataOverview.contract");
                let retention = t("privacy.dataOverview.untilDeletion");
                if (cat === "sessions") retention = t("privacy.dataOverview.30days");
                else if (cat === "moderation") retention = t("privacy.dataOverview.90days");
                return (
                  <div
                    key={cat}
                    className="flex items-center justify-between rounded-lg border p-3"
                  >
                    <span className="text-sm font-medium">
                      {t(`privacy.dataOverview.categories.${cat}`)}
                    </span>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        {legalBasis}
                      </Badge>
                      <Badge variant="secondary" className="text-xs">
                        {retention}
                      </Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Data export */}
        <Card>
          <CardHeader>
            <CardTitle>{t("dataExport.title")}</CardTitle>
            <CardDescription>{t("dataExport.description")}</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={handleExport} disabled={isExporting}>
              {isExporting ? <Loader2 className="animate-spin" /> : <Download className="size-4" />}
              {t("dataExport.jsonButton")}
            </Button>
            <Button variant="outline" onClick={handleExportCSV} disabled={isExportingCSV}>
              {isExportingCSV ? (
                <Loader2 className="animate-spin" />
              ) : (
                <FileSpreadsheet className="size-4" />
              )}
              {t("dataExport.csvButton")}
            </Button>
          </CardContent>
        </Card>

        {/* Processing restriction */}
        <Card>
          <CardHeader>
            <CardTitle>{t("privacy.processingRestriction.title")}</CardTitle>
            <CardDescription>{t("privacy.processingRestriction.description")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {isRestricted ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm text-amber-600">
                  <Shield className="size-4" />
                  {t("privacy.processingRestriction.active")}
                </div>
                <Button variant="outline" onClick={handleRestriction} disabled={isRestricting}>
                  {isRestricting && <Loader2 className="animate-spin" />}
                  <ShieldOff className="size-4" />
                  {t("privacy.processingRestriction.liftButton")}
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                <Textarea
                  value={restrictionReason}
                  onChange={(e) => setRestrictionReason(e.target.value)}
                  placeholder={t("privacy.processingRestriction.reasonPlaceholder")}
                  className="min-h-20 resize-none"
                />
                <Button
                  variant="outline"
                  onClick={handleRestriction}
                  disabled={isRestricting || restrictionReason.length < 10}
                >
                  {isRestricting && <Loader2 className="animate-spin" />}
                  <Shield className="size-4" />
                  {t("privacy.processingRestriction.activateButton")}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Data requests */}
        <Card>
          <CardHeader>
            <CardTitle>{t("privacy.dataRequest.title")}</CardTitle>
            <CardDescription>{t("privacy.dataRequest.description")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">{t("privacy.dataRequest.typeLabel")}</label>
              <Select
                value={requestType}
                onValueChange={(v) => setRequestType(v as DataRequestType)}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t("privacy.dataRequest.typeLabel")} />
                </SelectTrigger>
                <SelectContent>
                  {DataRequestType.values.map((type) => (
                    <SelectItem key={type} value={type}>
                      {t(`privacy.dataRequest.types.${type}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">
                {t("privacy.dataRequest.descriptionLabel")}
              </label>
              <Textarea
                value={requestDescription}
                onChange={(e) => setRequestDescription(e.target.value)}
                placeholder={t("privacy.dataRequest.descriptionPlaceholder")}
                className="min-h-20 resize-none"
              />
            </div>
            <Button
              variant="outline"
              onClick={handleSubmitDataRequest}
              disabled={isSubmittingRequest || !requestType || requestDescription.length < 10}
            >
              {isSubmittingRequest ? (
                <Loader2 className="animate-spin" />
              ) : (
                <Send className="size-4" />
              )}
              {t("privacy.dataRequest.submitButton")}
            </Button>
          </CardContent>
        </Card>

        {/* Consent history */}
        <Card>
          <CardHeader>
            <CardTitle>{t("privacy.consentHistory.title")}</CardTitle>
            <CardDescription>{t("privacy.consentHistory.description")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button variant="outline" onClick={handleShowHistory}>
              <History className="size-4" />
              {showHistory ? tCommon("hide") : tCommon("show")}
            </Button>
            {showHistory && (
              <div className="space-y-2">
                {consentHistoryRecords.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    {t("privacy.consentHistory.empty")}
                  </p>
                ) : (
                  consentHistoryRecords.map((record, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between rounded-lg border p-3"
                    >
                      <div className="space-y-0.5">
                        <p className="text-sm font-medium">
                          {tConsent(`purposes.${record.purpose}.name` as Parameters<typeof tConsent>[0])}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(record.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <Badge variant={record.granted ? "default" : "secondary"}>
                        {record.granted
                          ? t("privacy.consentHistory.granted")
                          : t("privacy.consentHistory.revoked")}
                      </Badge>
                    </div>
                  ))
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      {/* ── Account tab ── */}
      <TabsContent value="account" className="space-y-6">
        {/* Active sessions */}
        <Card>
          <CardHeader>
            <CardTitle>{t("account.sessions.title")}</CardTitle>
            <CardDescription>{t("account.sessions.description")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {sessions.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t("account.sessions.empty")}</p>
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
                        <Smartphone className="size-4 text-muted-foreground" />
                      ) : (
                        <Monitor className="size-4 text-muted-foreground" />
                      )}
                      <div className="space-y-0.5">
                        <p className="text-sm font-medium">
                          {session.current
                            ? t("account.sessions.current")
                            : t("account.sessions.lastActive", {
                                date: new Date(session.createdAt).toLocaleDateString(),
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
      </TabsContent>
    </Tabs>
  );
}
