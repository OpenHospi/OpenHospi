import type { Locale } from "@openhospi/i18n";
import { getMessages } from "@openhospi/i18n/email";
import { APP_NAME, BRAND_COLOR } from "@openhospi/shared/constants";
import { createTranslator } from "next-intl";
import type { ReactNode } from "react";
import { Body, Container, Font, Head, Hr, Html, Img, Preview, Section, Text } from "react-email";

type BaseLayoutProps = {
  children: ReactNode;
  previewText?: string;
  baseUrl: string;
  locale: Locale;
};

export async function BaseLayout({ children, previewText, baseUrl, locale }: BaseLayoutProps) {
  const messages = await getMessages(locale);
  const t = createTranslator({ locale, messages, namespace: "common" });
  const logoUrl = `${baseUrl}/logo.png`;

  return (
    <Html lang={locale}>
      <Head>
        <Font
          fontFamily="Inter"
          fallbackFontFamily="Helvetica"
          webFont={{
            url: "https://fonts.gstatic.com/s/inter/v21/UcCO3FwrK3iLTeHuS_nVMrMxCp50SjIw2boKoduKmMEVuLyfAZ9hiA.woff2",
            format: "woff2",
          }}
          fontWeight={400}
          fontStyle="normal"
        />
        <Font
          fontFamily="Inter"
          fallbackFontFamily="Helvetica"
          webFont={{
            url: "https://fonts.gstatic.com/s/inter/v21/UcCO3FwrK3iLTeHuS_nVMrMxCp50SjIw2boKoduKmMEVuI6fAZ9hiA.woff2",
            format: "woff2",
          }}
          fontWeight={600}
          fontStyle="normal"
        />
        <Font
          fontFamily="Inter"
          fallbackFontFamily="Helvetica"
          webFont={{
            url: "https://fonts.gstatic.com/s/inter/v21/UcCO3FwrK3iLTeHuS_nVMrMxCp50SjIw2boKoduKmMEVuFuYAZ9hiA.woff2",
            format: "woff2",
          }}
          fontWeight={700}
          fontStyle="normal"
        />
      </Head>
      {previewText && <Preview>{previewText}</Preview>}
      <Body style={body}>
        <Container style={container}>
          <Section style={header}>
            <Img src={logoUrl} width="40" height="40" alt={APP_NAME} style={logo} />
            <Text style={headerText}>{APP_NAME}</Text>
          </Section>
          <Hr style={hr} />
          <Section style={content}>{children}</Section>
          <Hr style={hr} />
          <Section style={footer}>
            <Text style={footerText}>{t("footer")}</Text>
            <Text style={footerMuted}>{t("doNotReply")}</Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

const body = {
  backgroundColor: "#f6f9fc",
  fontFamily: "Inter, Helvetica, Arial, sans-serif",
};

const container = {
  backgroundColor: "#ffffff",
  margin: "0 auto",
  padding: "20px 0 48px",
  maxWidth: "600px",
};

const header = {
  padding: "20px 32px",
  textAlign: "center" as const,
};

const logo = {
  display: "inline-block",
  verticalAlign: "middle",
  marginRight: "8px",
};

const headerText = {
  display: "inline",
  fontSize: "24px",
  fontWeight: "bold" as const,
  color: BRAND_COLOR,
  verticalAlign: "middle",
};

const hr = {
  borderColor: "#e6ebf1",
  margin: "0",
};

const content = {
  padding: "32px",
};

const footer = {
  padding: "20px 32px",
};

const footerText = {
  color: "#8898aa",
  fontSize: "12px",
  lineHeight: "16px",
  textAlign: "center" as const,
  margin: "0 0 8px",
};

const footerMuted = {
  color: "#aab7c4",
  fontSize: "11px",
  lineHeight: "16px",
  textAlign: "center" as const,
  margin: "0",
};
