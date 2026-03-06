import {Text} from "@react-email/components";

import {BaseLayout} from "../components/base-layout";

export type EventCancelledProps = {
    eventTitle: string;
    t: {
        heading: string;
        body: string;
        footer: string;
        doNotReply: string;
    };
};

export function EventCancelled({t}: EventCancelledProps) {
    return (
        <BaseLayout previewText={t.heading} t={t}>
            <Text style={heading}>{t.heading}</Text>
            <Text style={text}>{t.body}</Text>
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

export default function EventCancelledPreview() {
    return (
        <EventCancelled
            eventTitle="Movie Night"
            t={{
                heading: "Event cancelled",
                body: 'The hospi event "Movie Night" has been cancelled by the organiser.',
                footer: "OpenHospi — Free student housing platform for the Netherlands",
                doNotReply: "This is an automated message. Please do not reply to this email.",
            }}
        />
    );
}
