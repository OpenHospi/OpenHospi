import { NextResponse } from "next/server";

import { requireApiSession } from "@/app/api/mobile/_lib/auth";
import { getKeyBackup, upsertKeyBackup } from "@/lib/services/key-mutations";

export async function GET(request: Request) {
  try {
    const session = await requireApiSession(request);
    const backup = await getKeyBackup(session.user.id);

    if (!backup) {
      return NextResponse.json(null);
    }

    return NextResponse.json(backup);
  } catch (e) {
    if (e instanceof NextResponse) return e;
    throw e;
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireApiSession(request);
    const { encryptedData, iv, salt } = await request.json();

    if (!encryptedData || !iv || !salt) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 422 });
    }

    await upsertKeyBackup({
      userId: session.user.id,
      encryptedData,
      iv,
      salt,
    });

    return NextResponse.json({ success: true });
  } catch (e) {
    if (e instanceof NextResponse) return e;
    throw e;
  }
}
