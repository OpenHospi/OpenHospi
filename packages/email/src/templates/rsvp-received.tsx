import {Text} from "@react-email/components";

import {BaseLayout} from "../components/base-layout";

export type RsvpReceivedProps = {
    name: string;
    status: string;
    eventUrl: string;
    t: {
        heading: string;
        body: string;
        footer: string;
        doNotReply: string;
    };
};

export function RsvpReceived({t}: RsvpReceivedProps) {
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

export default function RsvpReceivedPreview() {
    return (
        <RsvpReceived
            name="Jan de Vries"
            status="attending"
            eventUrl="https://openhospi.nl/my-rooms"
            t={{
                heading: "New RSVP",
                body: "Jan de Vries has responded with: attending.",
                footer: "OpenHospi — Free student housing platform for the Netherlands",
                doNotReply: "This is an automated message. Please do not reply to this email.",
            }}
        />
    );
}
