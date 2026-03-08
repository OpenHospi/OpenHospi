import { NextResponse } from "next/server";

import { apiError, requireApiSession } from "@/app/api/mobile/_lib/auth";
import { auth } from "@/lib/auth/auth";

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireApiSession(request);
    const { id: sessionToken } = await params;

    await auth.api.revokeSession({
      body: { token: sessionToken },
      headers: request.headers,
    });

    return NextResponse.json({ success: true });
  } catch (e) {
    if (e instanceof NextResponse) return e;
    if (e instanceof Error) return apiError(e.message, 400);
    throw e;
  }
}
