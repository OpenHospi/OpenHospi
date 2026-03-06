import {Text} from "@react-email/components";

import {BaseLayout} from "../components/base-layout";

export type ApplicationNotChosenProps = {
    roomTitle: string;
    t: {
        heading: string;
        body: string;
        footer: string;
        doNotReply: string;
    };
};

export function ApplicationNotChosen({t}: ApplicationNotChosenProps) {
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

export default function ApplicationNotChosenPreview() {
    return (
        <ApplicationNotChosen
            roomTitle="Cosy room in Amsterdam"
            t={{
                heading: "Application update",
                body: 'Unfortunately, the room "Cosy room in Amsterdam" has been filled. Don\'t give up — there are plenty of other rooms available!',
                footer: "OpenHospi — Free student housing platform for the Netherlands",
                doNotReply: "This is an automated message. Please do not reply to this email.",
            }}
        />
    );
}
