import { useTranslations } from "next-intl";

export default function LocaleNotFound() {
  const t = useTranslations("app.errors");

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 text-center">
      <h1 className="text-2xl font-bold">{t("notFoundTitle")}</h1>
      <p className="text-muted-foreground">{t("notFoundDescription")}</p>
    </div>
  );
}
