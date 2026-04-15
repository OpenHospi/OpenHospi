import { NextResponse } from "next/server";

import { apiError, requireApiSession } from "@/app/api/mobile/_lib/auth";
import {
  getProcessingRestrictionForUser,
  liftProcessingRestrictionForUser,
  requestProcessingRestrictionForUser,
} from "@/lib/services/settings-mutations";

export async function GET(request: Request) {
  try {
    const session = await requireApiSession(request);
    const restriction = await getProcessingRestrictionForUser(session.user.id);
    return NextResponse.json(restriction);
  } catch (e) {
    if (e instanceof NextResponse) return e;
    throw e;
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireApiSession(request);
    const data = await request.json();
    const result = await requestProcessingRestrictionForUser(session.user.id, data);
    if ("error" in result && result.error) return apiError(result.error, 422);
    return NextResponse.json(result);
  } catch (e) {
    if (e instanceof NextResponse) return e;
    throw e;
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await requireApiSession(request);
    const result = await liftProcessingRestrictionForUser(session.user.id);
    return NextResponse.json(result);
  } catch (e) {
    if (e instanceof NextResponse) return e;
    throw e;
  }
}
