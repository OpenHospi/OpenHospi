import {getMessages} from "@openhospi/i18n/app";
import {render} from "@react-email/render";
import type {SupportedLocale} from "@openhospi/shared/constants";
import {createElement} from "react";

import {ApplicationAccepted} from "./templates/application-accepted";
import {ApplicationNotChosen} from "./templates/application-not-chosen";
import {EventCancelled} from "./templates/event-cancelled";
import {EventInvitation} from "./templates/event-invitation";
import {EventReminder} from "./templates/event-reminder";
import {ListingRemoved} from "./templates/listing-removed";
import {RsvpReceived} from "./templates/rsvp-received";
import {UserBanned} from "./templates/user-banned";
import {VerificationCode} from "./templates/verification-code";

export type EmailTemplateName =
    | "verificationCode"
    | "eventInvitation"
    | "eventReminder"
    | "eventCancelled"
    | "rsvpReceived"
    | "applicationAccepted"
    | "applicationNotChosen"
    | "userBanned"
    | "listingRemoved";

export type TemplatePropsMap = {
    verificationCode: { code: string; verificationUrl: string };
    eventInvitation: { eventTitle: string; roomTitle: string; eventUrl: string };
    eventReminder: { eventTitle: string; time: string; eventUrl: string };
    eventCancelled: { eventTitle: string };
    rsvpReceived: { name: string; status: string; eventUrl: string };
    applicationAccepted: { roomTitle: string; roomUrl: string };
    applicationNotChosen: { roomTitle: string };
    userBanned: { reason: string };
    listingRemoved: { reason: string };
};

function resolveTemplate(
    messages: Record<string, unknown>,
    templateName: string,
    params: Record<string, string>,
): string {
    const emails = messages.emails as Record<string, Record<string, string>>;
    const template = emails[templateName];
    if (!template) return templateName;

    let text = template.subject ?? templateName;
    for (const [k, v] of Object.entries(params)) {
        text = text.replaceAll(`{${k}}`, v);
    }
    return text;
}

function getTranslations(
    messages: Record<string, unknown>,
    templateName: string,
    params: Record<string, string>,
): Record<string, string> {
    const emails = messages.emails as Record<string, Record<string, string>>;
    const common = emails.common ?? {};
    const template = emails[templateName] ?? {};

    const merged = {...common, ...template};
    const result: Record<string, string> = {};

    for (const [key, value] of Object.entries(merged)) {
        if (key === "subject") continue;
        let text = value;
        for (const [k, v] of Object.entries(params)) {
            text = text.replaceAll(`{${k}}`, v);
        }
        result[key] = text;
    }
    return result;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const TEMPLATE_COMPONENTS: Record<EmailTemplateName, React.ComponentType<any>> = {
    verificationCode: VerificationCode,
    eventInvitation: EventInvitation,
    eventReminder: EventReminder,
    eventCancelled: EventCancelled,
    rsvpReceived: RsvpReceived,
    applicationAccepted: ApplicationAccepted,
    applicationNotChosen: ApplicationNotChosen,
    userBanned: UserBanned,
    listingRemoved: ListingRemoved,
};

export async function renderEmail<T extends EmailTemplateName>(
    template: T,
    props: TemplatePropsMap[T],
    locale: SupportedLocale,
): Promise<{ html: string; text: string; subject: string }> {
    const messages = await getMessages(locale);
    const subject = resolveTemplate(messages, template, props as Record<string, string>);
    const t = getTranslations(messages, template, props as Record<string, string>);

    const Component = TEMPLATE_COMPONENTS[template];
    const element = createElement(Component, {...props, t});

    const [html, text] = await Promise.all([
        render(element),
        render(element, {plainText: true}),
    ]);

    return {html, text, subject};
}
