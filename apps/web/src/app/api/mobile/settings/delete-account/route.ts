import { NextResponse } from "next/server";

import { requireApiSession } from "@/app/api/mobile/_lib/auth";
import { deleteAccountForUser } from "@/lib/services/settings-mutations";

export async function POST(request: Request) {
  try {
    const session = await requireApiSession(request);
    const result = await deleteAccountForUser(session.user.id);
    return NextResponse.json(result);
  } catch (e) {
    if (e instanceof NextResponse) return e;
    throw e;
  }
}
