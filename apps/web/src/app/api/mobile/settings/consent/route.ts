import { NextResponse } from "next/server";

import { apiError, requireApiSession } from "@/app/api/mobile/_lib/auth";
import { getActiveConsentsForUser, updateConsentForUser } from "@/lib/services/settings-mutations";

export async function GET(request: Request) {
  try {
    const session = await requireApiSession(request);
    const consents = await getActiveConsentsForUser(session.user.id);
    return NextResponse.json(consents);
  } catch (e) {
    if (e instanceof NextResponse) return e;
    throw e;
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await requireApiSession(request);
    const { purpose, granted } = await request.json();

    if (!purpose || typeof granted !== "boolean") {
      return apiError("Invalid data", 422);
    }

    const ipAddress = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;
    const userAgent = request.headers.get("user-agent") ?? null;

    const result = await updateConsentForUser(
      session.user.id,
      purpose,
      granted,
      ipAddress,
      userAgent,
    );
    return NextResponse.json(result);
  } catch (e) {
    if (e instanceof NextResponse) return e;
    throw e;
  }
}
