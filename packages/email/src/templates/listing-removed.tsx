import {Text} from "@react-email/components";

import {BaseLayout} from "../components/base-layout";

export type ListingRemovedProps = {
    reason: string;
    t: {
        heading: string;
        body: string;
        contact: string;
        footer: string;
        doNotReply: string;
    };
};

export function ListingRemoved({t}: ListingRemovedProps) {
    return (
        <BaseLayout previewText={t.heading} t={t}>
            <Text style={heading}>{t.heading}</Text>
            <Text style={text}>{t.body}</Text>
            <Text style={muted}>{t.contact}</Text>
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

const muted = {
    fontSize: "14px",
    color: "#666",
    lineHeight: "20px",
    margin: "16px 0 0",
};

export default function ListingRemovedPreview() {
    return (
        <ListingRemoved
            reason="Listing contains misleading information"
            t={{
                heading: "Listing removed",
                body: "Your listing has been removed for the following reason: Listing contains misleading information.",
                contact: "If you believe this is a mistake, please contact us at support@openhospi.nl.",
                footer: "OpenHospi — Free student housing platform for the Netherlands",
                doNotReply: "This is an automated message. Please do not reply to this email.",
            }}
        />
    );
}
