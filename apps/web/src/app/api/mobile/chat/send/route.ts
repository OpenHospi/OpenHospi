import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";

import { apiError, requireApiSession } from "@/app/api/mobile/_lib/auth";
import { createDrizzleSupabaseClient } from "@/lib/db";
import {
  conversationMembers,
  messagePayloads,
  messageReceipts,
  messages,
  senderKeyDistributions,
} from "@/lib/db/schema";
import { supabaseAdmin } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const session = await requireApiSession(request);
    const body = await request.json();
    const { conversationId, payload, deviceId, distributions } = body as {
      conversationId: string;
      payload: string;
      deviceId?: string;
      distributions?: Array<{ recipientDeviceId: string; ciphertext: string }>;
    };

    if (!conversationId || !payload) {
      return apiError("Missing required fields", 422);
    }

    const msg = await createDrizzleSupabaseClient(session.user.id).rls(async (tx) => {
      // Verify membership
      const [member] = await tx
        .select({ userId: conversationMembers.userId })
        .from(conversationMembers)
        .where(
          and(
            eq(conversationMembers.conversationId, conversationId),
            eq(conversationMembers.userId, session.user.id),
          ),
        );

      if (!member) throw new Error("Not a member");

      // Step 1: Store sender key distributions atomically (if provided)
      if (distributions && distributions.length > 0 && deviceId) {
        await tx.insert(senderKeyDistributions).values(
          distributions.map((dist) => ({
            conversationId,
            senderUserId: session.user.id,
            senderDeviceId: deviceId,
            recipientDeviceId: dist.recipientDeviceId,
            ciphertext: dist.ciphertext,
          })),
        );
      }

      // Step 2: Insert message
      const [msg] = await tx
        .insert(messages)
        .values({
          conversationId,
          senderId: session.user.id,
          senderDeviceId: deviceId ?? null,
          messageType: "ciphertext",
        })
        .returning();

      // Step 3: Insert encrypted payload
      await tx.insert(messagePayloads).values({
        messageId: msg.id,
        conversationId,
        senderUserId: session.user.id,
        senderDeviceId: deviceId ?? null,
        payload,
      });

      // Step 4: Create receipts for all other members
      const members = await tx
        .select({ userId: conversationMembers.userId })
        .from(conversationMembers)
        .where(eq(conversationMembers.conversationId, conversationId));

      const receiptValues = members
        .filter((m) => m.userId !== session.user.id)
        .map((m) => ({
          messageId: msg.id,
          userId: m.userId,
          status: "sent" as const,
        }));

      if (receiptValues.length > 0) {
        await tx.insert(messageReceipts).values(receiptValues);
      }

      return msg;
    });

    // Broadcast via Supabase Realtime
    const channel = supabaseAdmin.channel(`chat:${conversationId}`);
    try {
      if (distributions && distributions.length > 0) {
        await channel.httpSend({
          type: "broadcast",
          event: "sender_key_distribution",
          payload: { senderId: session.user.id, senderDeviceId: deviceId },
        });
      }
      await channel.httpSend({
        type: "broadcast",
        event: "new_message",
        payload: { messageId: msg.id, senderId: session.user.id, senderDeviceId: deviceId },
      });
    } catch {
      // Broadcast failure is non-critical
    }

    return NextResponse.json(msg);
  } catch (e) {
    if (e instanceof NextResponse) return e;
    throw e;
  }
}
