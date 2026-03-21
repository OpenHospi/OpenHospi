import type { SessionInfo } from "@openhospi/shared/api-types";
import { NextResponse } from "next/server";

import { requireApiSession } from "@/app/api/mobile/_lib/auth";
import { auth } from "@/lib/auth/auth";

export async function GET(request: Request) {
  try {
    const session = await requireApiSession(request);
    const sessions = await auth.api.listSessions({ headers: request.headers });
    return NextResponse.json<SessionInfo[]>(
      (sessions ?? []).map(
        (s): SessionInfo => ({
          id: s.id,
          userAgent: s.userAgent ?? null,
          ipAddress: s.ipAddress ?? null,
          createdAt: s.createdAt.toISOString(),
          expiresAt: s.expiresAt.toISOString(),
          isCurrent: s.token === session.session.token,
        }),
      ),
    );
  } catch (e) {
    if (e instanceof NextResponse) return e;
    throw e;
  }
}
