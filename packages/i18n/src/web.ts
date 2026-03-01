import type { Locale } from "./index.js";

export async function getMessages(locale: Locale) {
  switch (locale) {
    case "en": {
      const [shared, web, admin] = await Promise.all([
        import("../messages/en/shared.json").then((m) => m.default),
        import("../messages/en/web.json").then((m) => m.default),
        import("../messages/en/admin.json").then((m) => m.default),
      ]);
      return { ...shared, ...web, ...admin };
    }
    case "de": {
      const [shared, web, admin] = await Promise.all([
        import("../messages/de/shared.json").then((m) => m.default),
        import("../messages/de/web.json").then((m) => m.default),
        import("../messages/de/admin.json").then((m) => m.default),
      ]);
      return { ...shared, ...web, ...admin };
    }
    default: {
      const [shared, web, admin] = await Promise.all([
        import("../messages/nl/shared.json").then((m) => m.default),
        import("../messages/nl/web.json").then((m) => m.default),
        import("../messages/nl/admin.json").then((m) => m.default),
      ]);
      return { ...shared, ...web, ...admin };
    }
  }
}
