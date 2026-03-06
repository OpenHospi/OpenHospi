import {Link, Text} from "@react-email/components";
import {BRAND_COLOR} from "@openhospi/shared/constants";

import {BaseLayout} from "../components/base-layout";

export type VerificationCodeProps = {
    code: string;
    verificationUrl: string;
    t: {
        heading: string;
        codeLabel: string;
        orClickLink: string;
        expiresIn: string;
        footer: string;
        doNotReply: string;
    };
};

export function VerificationCode({code, verificationUrl, t}: VerificationCodeProps) {
    return (
        <BaseLayout previewText={`${t.codeLabel} ${code}`} t={t}>
            <Text style={heading}>{t.heading}</Text>
            <Text style={label}>{t.codeLabel}</Text>
            <Text style={codeStyle}>{code}</Text>
            <Text style={text}>{t.orClickLink}</Text>
            <Link href={verificationUrl} style={link}>
                {verificationUrl}
            </Link>
            <Text style={muted}>{t.expiresIn}</Text>
        </BaseLayout>
    );
}

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
    borderRadius: "8px",
    margin: "0 0 24px",
};

const text = {
    fontSize: "14px",
    color: "#666",
    margin: "0 0 8px",
};

const link = {
    color: BRAND_COLOR,
    fontSize: "14px",
    wordBreak: "break-all" as const,
};

const muted = {
    fontSize: "12px",
    color: "#999",
    margin: "16px 0 0",
};

export default function VerificationCodePreview() {
    return (
        <VerificationCode
            code="123456"
            verificationUrl="https://openhospi.nl/verify?token=abc123"
            t={{
                heading: "Verify your email",
                codeLabel: "Your verification code:",
                orClickLink: "Or verify by clicking this link:",
                expiresIn: "This code expires in 60 minutes.",
                footer: "OpenHospi — Free student housing platform for the Netherlands",
                doNotReply: "This is an automated message. Please do not reply to this email.",
            }}
        />
    );
}
