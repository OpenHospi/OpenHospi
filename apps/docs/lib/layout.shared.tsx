import { defineI18nUI } from "fumadocs-ui/i18n";
import type { BaseLayoutProps } from "fumadocs-ui/layouts/shared";

import { i18n } from "@/lib/i18n";

export const gitConfig = {
  user: "OpenHospi",
  repo: "OpenHospi",
  branch: "main",
};

export const i18nUI = defineI18nUI(i18n, {
  translations: {
    nl: {
      displayName: "Nederlands",
      search: "Zoek documentatie",
    },
    en: {
      displayName: "English",
    },
  },
});

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function baseOptions(locale: string): BaseLayoutProps {
  return {
    i18n,
    nav: {
      title: "OpenHospi Docs",
    },
    githubUrl: `https://github.com/${gitConfig.user}/${gitConfig.repo}`,
  };
}
