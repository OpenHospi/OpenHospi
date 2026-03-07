import { NextResponse } from "next/server";

import { apiError, requireApiSession } from "@/app/api/mobile/_lib/auth";
import { updatePreferredLocaleForUser } from "@/lib/services/settings-mutations";

export async function PATCH(request: Request) {
  try {
    const session = await requireApiSession(request);
    const { locale } = await request.json();
    const result = await updatePreferredLocaleForUser(session.user.id, locale);
    if ("error" in result && result.error) return apiError(result.error, 422);
    return NextResponse.json(result);
  } catch (e) {
    if (e instanceof NextResponse) return e;
    throw e;
  }
}
