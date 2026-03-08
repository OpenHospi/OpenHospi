import { NextResponse } from "next/server";

import { requireApiSession } from "@/app/api/mobile/_lib/auth";
import { auth } from "@/lib/auth/auth";

export async function GET(request: Request) {
  try {
    const session = await requireApiSession(request);
    const sessions = await auth.api.listSessions({ headers: request.headers });
    return NextResponse.json(
      (sessions ?? []).map((s) => ({
        id: s.id,
        userAgent: s.userAgent,
        ipAddress: s.ipAddress,
        createdAt: s.createdAt,
        expiresAt: s.expiresAt,
        isCurrent: s.token === session.session.token,
      })),
    );
  } catch (e) {
    if (e instanceof NextResponse) return e;
    throw e;
  }
}
