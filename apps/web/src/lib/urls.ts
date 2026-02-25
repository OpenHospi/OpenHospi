const APP_URL = process.env.NEXT_PUBLIC_APP_URL;

export function getLoginUrl(): string {
  if (!APP_URL) return "/login";
  return `${APP_URL}/login`;
}

export function getAppUrl(path: string): string {
  if (!APP_URL) return path;
  return `${APP_URL}${path}`;
}
