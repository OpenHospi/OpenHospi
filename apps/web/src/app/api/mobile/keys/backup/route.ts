import { NextResponse } from "next/server";

import { apiError, requireApiSession } from "@/app/api/mobile/_lib/auth";
import { getKeyBackup, removeKeyBackup, upsertKeyBackup } from "@/lib/services/key-mutations";

export async function GET(request: Request) {
  try {
    const session = await requireApiSession(request);
    const backup = await getKeyBackup(session.user.id);
    return NextResponse.json(backup);
  } catch (e) {
    if (e instanceof NextResponse) return e;
    throw e;
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireApiSession(request);
    const body = (await request.json()) as {
      encryptedPrivateKey?: string;
      backupIv?: string;
      salt?: string;
    };

    if (!body.encryptedPrivateKey || !body.backupIv || !body.salt) {
      return apiError("encryptedPrivateKey, backupIv, and salt are required", 400);
    }

    await upsertKeyBackup(session.user.id, {
      encryptedPrivateKey: body.encryptedPrivateKey,
      backupIv: body.backupIv,
      salt: body.salt,
    });
    return NextResponse.json({ success: true });
  } catch (e) {
    if (e instanceof NextResponse) return e;
    throw e;
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await requireApiSession(request);
    await removeKeyBackup(session.user.id);
    return new NextResponse(null, { status: 204 });
  } catch (e) {
    if (e instanceof NextResponse) return e;
    throw e;
  }
}
