import {Text} from "@react-email/components";

import {BaseLayout} from "../components/base-layout";
import {CtaButton} from "../components/cta-button";

export type ApplicationAcceptedProps = {
    roomTitle: string;
    roomUrl: string;
    t: {
        heading: string;
        body: string;
        cta: string;
        footer: string;
        doNotReply: string;
    };
};

export function ApplicationAccepted({roomUrl, t}: ApplicationAcceptedProps) {
    return (
        <BaseLayout previewText={t.heading} t={t}>
            <Text style={heading}>{t.heading}</Text>
            <Text style={text}>{t.body}</Text>
            <CtaButton href={roomUrl}>{t.cta}</CtaButton>
        </BaseLayout>
    );
}

const heading = {
    fontSize: "24px",
    fontWeight: "bold" as const,
    color: "#1a1a1a",
    margin: "0 0 16px",
};

const text = {
    fontSize: "16px",
    color: "#333",
    lineHeight: "24px",
    margin: "0 0 8px",
};

export default function ApplicationAcceptedPreview() {
    return (
        <ApplicationAccepted
            roomTitle="Cosy room in Amsterdam"
            roomUrl="https://openhospi.nl/rooms/123"
            t={{
                heading: "Application accepted!",
                body: 'Great news — you\'ve been chosen for the room "Cosy room in Amsterdam". The room owner will be in touch with next steps.',
                cta: "View room",
                footer: "OpenHospi — Free student housing platform for the Netherlands",
                doNotReply: "This is an automated message. Please do not reply to this email.",
            }}
        />
    );
}
