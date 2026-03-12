import type { SenderKeyDistributionEnvelope } from "@openhospi/crypto";
import { NextResponse } from "next/server";

import { apiError, apiSuccess, requireApiSession } from "@/app/api/mobile/_lib/auth";
import {
  getDistributionRecipients,
  getSenderKeyDistribution,
  insertSenderKeyDistributions,
} from "@/lib/services/key-mutations";

export async function GET(request: Request) {
  try {
    const session = await requireApiSession(request);
    const userId = session.user.id;

    const url = new URL(request.url);
    const conversationId = url.searchParams.get("conversationId");

    if (!conversationId) {
      return apiError("conversationId is required", 400);
    }

    // List mode: return recipient IDs for the current user's distributions
    const listRecipients = url.searchParams.get("listRecipients");
    if (listRecipients === "true") {
      const recipients = await getDistributionRecipients(conversationId, userId);
      return apiSuccess({ recipients });
    }

    // Fetch mode: return a specific distribution for the current user
    const senderUserId = url.searchParams.get("senderUserId");
    if (!senderUserId) {
      return apiError("senderUserId or listRecipients=true is required", 400);
    }

    const distribution = await getSenderKeyDistribution(conversationId, senderUserId, userId);
    return apiSuccess(distribution);
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
      distributions?: {
        recipientUserId: string;
        envelope: SenderKeyDistributionEnvelope;
      }[];
    };

    if (!body.conversationId || !body.distributions || body.distributions.length === 0) {
      return apiError("conversationId and distributions array are required", 400);
    }

    await insertSenderKeyDistributions(userId, body.conversationId, body.distributions);

    return apiSuccess({ ok: true });
  } catch (e) {
    if (e instanceof NextResponse) return e;
    throw e;
  }
}
