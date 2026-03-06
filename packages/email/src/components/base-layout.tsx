import {
  Body,
  Container,
  Head,
  Hr,
  Html,
  Img,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import { APP_NAME, BRAND_COLOR } from "@openhospi/shared/constants";
import type { ReactNode } from "react";
const LOGO_URL = `${process.env.NEXT_PUBLIC_APP_URL ?? "https://openhospi.nl"}/logo.svg`;

type BaseLayoutProps = {
  children: ReactNode;
  previewText?: string;
  t: {
    footer: string;
    doNotReply: string;
  };
};

export function BaseLayout({ children, previewText, t }: BaseLayoutProps) {
  return (
    <Html>
      <Head />
      {previewText && <Preview>{previewText}</Preview>}
      <Body style={body}>
        <Container style={container}>
          <Section style={header}>
            <Img src={LOGO_URL} width="40" height="40" alt={APP_NAME} style={logo} />
            <Text style={headerText}>{APP_NAME}</Text>
          </Section>
          <Hr style={hr} />
          <Section style={content}>{children}</Section>
          <Hr style={hr} />
          <Section style={footer}>
            <Text style={footerText}>{t.footer}</Text>
            <Text style={footerMuted}>{t.doNotReply}</Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

const body = {
  backgroundColor: "#f6f9fc",
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Ubuntu, sans-serif',
};

const container = {
  backgroundColor: "#ffffff",
  margin: "0 auto",
  padding: "20px 0 48px",
  maxWidth: "600px",
  borderRadius: "8px",
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
