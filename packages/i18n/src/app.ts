import type { Locale } from "./index.js";

export async function getMessages(locale: Locale) {
  switch (locale) {
    case "en": {
      const [shared, app] = await Promise.all([
        import("../messages/en/shared.json").then((m) => m.default),
        import("../messages/en/app.json").then((m) => m.default),
      ]);
      return { ...shared, ...app };
    }
    case "de": {
      const [shared, app] = await Promise.all([
        import("../messages/de/shared.json").then((m) => m.default),
        import("../messages/de/app.json").then((m) => m.default),
      ]);
      return { ...shared, ...app };
    }
    default: {
      const [shared, app] = await Promise.all([
        import("../messages/nl/shared.json").then((m) => m.default),
        import("../messages/nl/app.json").then((m) => m.default),
      ]);
      return { ...shared, ...app };
    }
  }
}
