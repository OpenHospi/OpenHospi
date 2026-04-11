export interface Sponsor {
  name: string;
  logoLight: string;
  logoDark?: string;
  url: string;
  /** If true, this sponsor appears in the waived costs section on the costs page. */
  waived?: boolean;
}

export const SPONSORS: Sponsor[] = [
  // {
  //   name: "Digital Society Hub",
  //   logoLight: "/sponsors/dsh.svg",
  //   url: "https://www.digitalsocietyhub.nl",
  // },
  {
    name: "Sentry",
    logoLight: "/sponsors/sentry/sentry-wordmark-dark-400x119.svg",
    logoDark: "/sponsors/sentry/sentry-wordmark-light-400x119.svg",
    url: "https://sentry.io",
    waived: true,
  },
  {
    name: "Apple",
    logoLight: "/sponsors/apple/Apple_Developer_dark_brandmark.svg",
    logoDark: "/sponsors/apple/Apple_Developer_light_brandmark.svg",
    url: "https://developer.apple.com",
    waived: true,
  },
  {
    name: "Google Workspace",
    logoLight: "/sponsors/Google_Workspace_Logo.svg",
    url: "https://workspace.google.com",
    waived: true,
  },
  {
    name: "GitHub",
    // eslint-disable-next-line no-secrets/no-secrets
    logoLight: "/sponsors/github/GitHub_Lockup_Black_Clearspace.svg",
    // eslint-disable-next-line no-secrets/no-secrets
    logoDark: "/sponsors/github/GitHub_Lockup_White_Clearspace.svg",
    url: "https://github.com",
    waived: true,
  },
  {
    name: "Crowdin",
    logoLight: "/sponsors/crowdin/crowdin-core-logo-cDark.svg",
    logoDark: "/sponsors/crowdin/crowdin-core-logo-cWhite.svg",
    url: "https://crowdin.com",
    waived: true,
  },
];

export const WAIVED_SPONSORS = SPONSORS.filter((s) => s.waived);
