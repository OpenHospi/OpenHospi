import { NextResponse } from "next/server";

import { auth } from "@/lib/auth/auth";

export type ApiSession = Awaited<ReturnType<typeof auth.api.getSession>> & {};

export async function requireApiSession(request: Request): Promise<ApiSession> {
  const session = await auth.api.getSession({
    headers: request.headers,
  });

  if (!session) {
    throw NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return session;
}

export function apiError(message: string, status: number, code?: string): NextResponse {
  return NextResponse.json({ error: message, ...(code ? { code } : {}) }, { status });
}

export function apiSuccess<T>(data: T, status = 200): NextResponse {
  return NextResponse.json(data, { status });
}
