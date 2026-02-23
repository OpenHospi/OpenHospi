import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { auth } from "./auth";

export async function getSession() {
  return auth.api.getSession({ headers: await headers() });
}

export async function requireSession(locale: string) {
  const session = await getSession();
  if (!session) redirect(`/${locale}/login`);
  return session;
}
