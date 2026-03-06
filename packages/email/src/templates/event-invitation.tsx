import {Text} from "@react-email/components";

import {BaseLayout} from "../components/base-layout";
import {CtaButton} from "../components/cta-button";

export type EventInvitationProps = {
    eventTitle: string;
    roomTitle: string;
    eventUrl: string;
    t: {
        heading: string;
        body: string;
        cta: string;
        footer: string;
        doNotReply: string;
    };
};

export function EventInvitation({eventUrl, t}: EventInvitationProps) {
    return (
        <BaseLayout previewText={t.heading} t={t}>
            <Text style={heading}>{t.heading}</Text>
            <Text style={text}>{t.body}</Text>
            <CtaButton href={eventUrl}>{t.cta}</CtaButton>
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

export default function EventInvitationPreview() {
    return (
        <EventInvitation
            eventTitle="Movie Night"
            roomTitle="Cosy room in Amsterdam"
            eventUrl="https://openhospi.nl/applications"
            t={{
                heading: "You're invited!",
                body: 'You\'ve been invited to the hospi event "Movie Night" for the room "Cosy room in Amsterdam".',
                cta: "View invitation",
                footer: "OpenHospi — Free student housing platform for the Netherlands",
                doNotReply: "This is an automated message. Please do not reply to this email.",
            }}
        />
    );
}
