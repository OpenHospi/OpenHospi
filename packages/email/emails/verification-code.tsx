import { getMessages } from "@openhospi/i18n/email";
import { createTranslator } from "next-intl";
import { Heading, Text } from "react-email";

import { BaseLayout } from "./_components/base-layout";
import { code, codeHint, heading, label } from "./_components/styles";
import type { BaseEmailProps } from "./_types";

type VerificationCodeProps = BaseEmailProps & { code: string };

export async function VerificationCode({
  code: verificationCode,
  locale,
  baseUrl,
}: VerificationCodeProps) {
  const messages = await getMessages(locale);
  const t = createTranslator({ locale, messages, namespace: "verificationCode" });

  return (
    <BaseLayout
      previewText={`${t("codeLabel")} ${verificationCode}`}
      locale={locale}
      baseUrl={baseUrl}
    >
      <Heading as="h1" style={heading}>
        {t("heading")}
      </Heading>
      <Text style={label}>{t("codeLabel")}</Text>
      <Text style={code}>{verificationCode}</Text>
      <Text style={codeHint}>{t("expiresIn")}</Text>
    </BaseLayout>
  );
}

VerificationCode.PreviewProps = {
  code: "123456",
  baseUrl: "http://localhost:3000",
  locale: "nl",
};

export default VerificationCode;
