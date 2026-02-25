const APP_URL = process.env.NEXT_PUBLIC_APP_URL;

export function getLoginUrl(locale: string): string {
  if (!APP_URL) return `/${locale}/login`;
  return `${APP_URL}/${locale}/login`;
}

export function getAppUrl(locale: string, path: string): string {
  if (!APP_URL) return `/${locale}${path}`;
  return `${APP_URL}/${locale}${path}`;
}
