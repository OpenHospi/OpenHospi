import {Text} from "@react-email/components";

import {BaseLayout} from "../components/base-layout";
import {CtaButton} from "../components/cta-button";

export type EventReminderProps = {
    eventTitle: string;
    time: string;
    eventUrl: string;
    t: {
        heading: string;
        body: string;
        cta: string;
        footer: string;
        doNotReply: string;
    };
};

export function EventReminder({eventUrl, t}: EventReminderProps) {
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

export default function EventReminderPreview() {
    return (
        <EventReminder
            eventTitle="Movie Night"
            time="19:00"
            eventUrl="https://openhospi.nl/applications"
            t={{
                heading: "Event reminder",
                body: 'Just a reminder that "Movie Night" starts at 19:00.',
                cta: "View event",
                footer: "OpenHospi — Free student housing platform for the Netherlands",
                doNotReply: "This is an automated message. Please do not reply to this email.",
            }}
        />
    );
}
