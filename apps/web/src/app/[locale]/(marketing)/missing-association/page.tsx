"use client";

import { Check, Copy, Mail } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [text]);

  return (
    <Button variant="ghost" size="icon" className="size-7 shrink-0" onClick={handleCopy}>
      {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
    </Button>
  );
}

export default function MissingAssociationPage() {
  const t = useTranslations("missingAssociation");

  const emailTo = "me@rubentalstra.nl";
  const subject = t("emailSubject");
  const body = t("emailBody");

  return (
    <section className="py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <Mail className="mx-auto size-12 text-primary" />
          <h1 className="mt-6 text-3xl font-bold tracking-tight sm:text-4xl">{t("title")}</h1>
          <p className="mt-4 text-lg text-muted-foreground">{t("description")}</p>
        </div>

        <Card className="mx-auto mt-12 max-w-lg">
          <CardHeader>
            <CardTitle className="text-base">{t("cardTitle")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground">{t("labels.to")}</p>
              <div className="flex items-center justify-between rounded-md border bg-muted/50 px-3 py-2">
                <code className="text-sm">{emailTo}</code>
                <CopyButton text={emailTo} />
              </div>
            </div>

            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground">{t("labels.subject")}</p>
              <div className="flex items-center justify-between rounded-md border bg-muted/50 px-3 py-2">
                <span className="text-sm">{subject}</span>
                <CopyButton text={subject} />
              </div>
            </div>

            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground">{t("labels.body")}</p>
              <div className="flex items-start justify-between rounded-md border bg-muted/50 px-3 py-2">
                <pre className="whitespace-pre-wrap text-sm">{body}</pre>
                <CopyButton text={body} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
