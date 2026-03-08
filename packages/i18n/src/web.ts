import type { Locale } from "./config";
import type { WebMessages } from "./types";

type Loader = () => Promise<Record<string, unknown>>;

const loaders: Record<Locale, Loader[]> = {
  nl: [
    () => import("../messages/nl/shared.json").then((m) => m.default),
    () => import("../messages/nl/web.json").then((m) => m.default),
    () => import("../messages/nl/admin.json").then((m) => m.default),
    () => import("../messages/nl/legal.json").then((m) => m.default),
  ],
  en: [
    () => import("../messages/en/shared.json").then((m) => m.default),
    () => import("../messages/en/web.json").then((m) => m.default),
    () => import("../messages/en/admin.json").then((m) => m.default),
    () => import("../messages/en/legal.json").then((m) => m.default),
  ],
  de: [
    () => import("../messages/de/shared.json").then((m) => m.default),
    () => import("../messages/de/web.json").then((m) => m.default),
    () => import("../messages/de/admin.json").then((m) => m.default),
    () => import("../messages/de/legal.json").then((m) => m.default),
  ],
};

export async function getMessages(locale: Locale): Promise<WebMessages> {
  const parts = await Promise.all(loaders[locale].map((load) => load()));
  return Object.assign({}, ...parts) as WebMessages;
}
