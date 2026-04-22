import { getMessages } from "@openhospi/i18n/email";
import { createTranslator } from "next-intl";
import { Heading, Text } from "react-email";

import { BaseLayout } from "./_components/base-layout";
import { heading, text } from "./_components/styles";
import type { BaseEmailProps } from "./_types";

type ApplicationNotChosenProps = BaseEmailProps & {
  roomTitle: string;
};

export async function ApplicationNotChosen({
  roomTitle,
  locale,
  baseUrl,
}: ApplicationNotChosenProps) {
  const messages = await getMessages(locale);
  const t = createTranslator({ locale, messages, namespace: "applicationNotChosen" });

  return (
    <BaseLayout previewText={t("heading")} locale={locale} baseUrl={baseUrl}>
      <Heading as="h1" style={heading}>
        {t("heading")}
      </Heading>
      <Text style={text}>{t("body", { roomTitle })}</Text>
    </BaseLayout>
  );
}

ApplicationNotChosen.PreviewProps = {
  roomTitle: "Cosy room in Amsterdam",
  baseUrl: "http://localhost:3000",
  locale: "nl",
};

export default ApplicationNotChosen;
