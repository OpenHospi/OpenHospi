import { NextResponse } from "next/server";

import { apiError, apiSuccess, requireApiSession } from "@/app/api/mobile/_lib/auth";
import {
  getPendingSenderKeyDistributions,
  insertSenderKeyDistribution,
  markDistributionDelivered,
} from "@/lib/services/key-mutations";

export async function GET(request: Request) {
  try {
    await requireApiSession(request);

    const url = new URL(request.url);
    const recipientDeviceId = url.searchParams.get("recipientDeviceId");

    if (!recipientDeviceId) {
      return apiError("recipientDeviceId is required", 400);
    }

    const distributions = await getPendingSenderKeyDistributions(recipientDeviceId);
    return apiSuccess({ distributions });
  } catch (e) {
    if (e instanceof NextResponse) return e;
    throw e;
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireApiSession(request);
    const userId = session.user.id;

    const body = (await request.json()) as {
      conversationId?: string;
      senderDeviceId?: string;
      recipientDeviceId?: string;
      ciphertext?: string;
    };

    if (
      !body.conversationId ||
      !body.senderDeviceId ||
      !body.recipientDeviceId ||
      !body.ciphertext
    ) {
      return apiError(
        "conversationId, senderDeviceId, recipientDeviceId, and ciphertext are required",
        400,
      );
    }

    await insertSenderKeyDistribution(
      body.conversationId,
      userId,
      body.senderDeviceId,
      body.recipientDeviceId,
      body.ciphertext,
    );

    return apiSuccess({ ok: true });
  } catch (e) {
    if (e instanceof NextResponse) return e;
    throw e;
  }
}

export async function PATCH(request: Request) {
  try {
    await requireApiSession(request);

    const body = (await request.json()) as { distributionId?: string };
    if (!body.distributionId) {
      return apiError("distributionId is required", 400);
    }

    await markDistributionDelivered(body.distributionId);
    return apiSuccess({ ok: true });
  } catch (e) {
    if (e instanceof NextResponse) return e;
    throw e;
  }
}
