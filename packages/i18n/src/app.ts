import type { Locale } from "./config";

type Loader = () => Promise<Record<string, unknown>>;

const loaders: Record<Locale, Loader[]> = {
  nl: [
    () => import("../messages/nl/shared.json").then((m) => m.default),
    () => import("../messages/nl/app.json").then((m) => m.default),
  ],
  en: [
    () => import("../messages/en/shared.json").then((m) => m.default),
    () => import("../messages/en/app.json").then((m) => m.default),
  ],
  de: [
    () => import("../messages/de/shared.json").then((m) => m.default),
    () => import("../messages/de/app.json").then((m) => m.default),
  ],
};

export async function getMessages(locale: Locale) {
  const parts = await Promise.all(loaders[locale].map((load) => load()));
  return Object.assign({}, ...parts);
}
