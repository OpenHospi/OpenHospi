import {Text} from "@react-email/components";
import {BRAND_COLOR} from "@openhospi/shared/constants";
import {createTranslator} from "next-intl";

import {BaseLayout} from "../components/base-layout";
import type {BaseEmailProps} from "../types";

type VerificationCodeProps = BaseEmailProps & {
    code: string;
};

export function VerificationCode({code, locale, baseUrl, messages}: VerificationCodeProps) {
    const t = createTranslator({locale, messages, namespace: "emails.verificationCode"});

    return (
        <BaseLayout previewText={`${t("codeLabel")} ${code}`} locale={locale} baseUrl={baseUrl} messages={messages}>
            <Text style={heading}>{t("heading")}</Text>
            <Text style={label}>{t("codeLabel")}</Text>
            <Text style={codeStyle}>{code}</Text>
            <Text style={muted}>{t("expiresIn")}</Text>
        </BaseLayout>
    );
}

VerificationCode.PreviewProps = {
    code: "123456",
    baseUrl: "http://localhost:3000",
    locale: "en",
    messages: {
        emails: {
            common: {
                footer: "OpenHospi — Free student housing platform for the Netherlands",
                doNotReply: "This is an automated message. Please do not reply to this email.",
            },
            verificationCode: {
                heading: "Verify your email",
                codeLabel: "Your verification code:",
                expiresIn: "This code expires in 60 minutes.",
            },
        },
    },
};

export default VerificationCode;

const heading = {
    fontSize: "24px",
    fontWeight: "bold" as const,
    color: "#1a1a1a",
    margin: "0 0 16px",
};

const label = {
    fontSize: "14px",
    color: "#666",
    margin: "0 0 8px",
};

const codeStyle = {
    fontSize: "36px",
    fontWeight: "bold" as const,
    color: BRAND_COLOR,
    letterSpacing: "6px",
    textAlign: "center" as const,
    padding: "16px",
    backgroundColor: "#f0fdfa",
    margin: "0 0 24px",
};

const muted = {
    fontSize: "12px",
    color: "#999",
    margin: "16px 0 0",
};
