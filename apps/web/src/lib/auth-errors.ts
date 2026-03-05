/**
 * Maps Better Auth error codes to next-intl translation keys.
 *
 * Usage in components:
 *   const t = useTranslations("auth.errors");
 *   const message = getAuthErrorMessage(error.code, t);
 *
 * All error codes come from `auth.$ERROR_CODES` (Better Auth).
 * Translation keys live in shared.json under `auth.errors.*`.
 */

/**
 * Known Better Auth error codes that we translate.
 * Add new codes here as they are encountered.
 */
export const AUTH_ERROR_CODES = [
  "INVALID_EMAIL",
  "INVALID_PASSWORD",
  "INVALID_TOKEN",
  "USER_NOT_FOUND",
  "USER_ALREADY_EXISTS",
  "EMAIL_NOT_VERIFIED",
  "SESSION_EXPIRED",
  "FAILED_TO_CREATE_USER",
  "FAILED_TO_CREATE_SESSION",
  "FAILED_TO_GET_SESSION",
  "INVALID_EMAIL_OR_PASSWORD",
  "SOCIAL_ACCOUNT_ALREADY_LINKED",
  "PROVIDER_NOT_FOUND",
  "FAILED_TO_GET_USER_INFO",
  "ACCOUNT_NOT_FOUND",
  "CREDENTIAL_ACCOUNT_NOT_FOUND",
] as const;

export type AuthErrorCode = (typeof AUTH_ERROR_CODES)[number];

/**
 * Returns a translated error message for a Better Auth error code.
 * Falls back to the raw error message if no translation exists.
 */
export function getAuthErrorMessage(
  code: string | undefined,
  t: (key: string) => string,
  tHas: (key: string) => boolean,
  fallbackMessage?: string,
): string {
  if (!code) return fallbackMessage ?? "";
  if (tHas(code)) return t(code);
  return fallbackMessage ?? code;
}
