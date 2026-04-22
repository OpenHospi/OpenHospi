import { getMessages } from "@openhospi/i18n/email";
import { createTranslator } from "next-intl";
import { Heading, Text } from "react-email";

import { BaseLayout } from "./_components/base-layout";
import { heading, text } from "./_components/styles";
import type { BaseEmailProps } from "./_types";

type RsvpReceivedProps = BaseEmailProps & {
  name: string;
  status: string;
  eventUrl: string;
};

export async function RsvpReceived({ name, status, locale, baseUrl }: RsvpReceivedProps) {
  const messages = await getMessages(locale);
  const t = createTranslator({ locale, messages, namespace: "rsvpReceived" });

  return (
    <BaseLayout previewText={t("heading")} locale={locale} baseUrl={baseUrl}>
      <Heading as="h1" style={heading}>
        {t("heading")}
      </Heading>
      <Text style={text}>{t("body", { name, status })}</Text>
    </BaseLayout>
  );
}

RsvpReceived.PreviewProps = {
  name: "Jan de Vries",
  status: "attending",
  eventUrl: "http://localhost:3000/my-rooms",
  baseUrl: "http://localhost:3000",
  locale: "nl",
};

export default RsvpReceived;
