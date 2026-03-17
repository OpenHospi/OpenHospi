import { source } from "@/lib/source";
import { createFromSource } from "fumadocs-core/search/server";
import { i18n } from "@/lib/i18n";

export const { GET } = createFromSource(source, {
  i18n,
  language: "dutch",
  localeMap: {
    en: "english",
  },
});
