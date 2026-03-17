import { and, eq, sql } from "drizzle-orm";
import { NextResponse } from "next/server";

import { apiSuccess, requireApiSession } from "@/app/api/mobile/_lib/auth";
import { db } from "@/lib/db";
import { devices, oneTimePreKeys, signedPreKeys } from "@/lib/db/schema";

/**
 * GET /api/encryption/prekey-bundle/[userId]
 *
 * Returns prekey bundles for ALL active devices of a user.
 * Each bundle includes: device info, latest signed prekey, and one consumed OTP.
 * This is what the sender needs to establish X3DH sessions with every device.
 */
export async function GET(request: Request, { params }: { params: Promise<{ userId: string }> }) {
  try {
    await requireApiSession(request);
    const { userId } = await params;

    // Get all active devices for the target user
    const userDevices = await db
      .select({
        id: devices.id,
        deviceId: devices.deviceId,
        registrationId: devices.registrationId,
        identityKeyPublic: devices.identityKeyPublic,
      })
      .from(devices)
      .where(and(eq(devices.userId, userId), eq(devices.isActive, true)));

    const bundles = await Promise.all(
      userDevices.map(async (device) => {
        // Get latest signed prekey
        const [spk] = await db
          .select({
            keyId: signedPreKeys.keyId,
            publicKey: signedPreKeys.publicKey,
            signature: signedPreKeys.signature,
          })
          .from(signedPreKeys)
          .where(eq(signedPreKeys.deviceId, device.id))
          .orderBy(sql`${signedPreKeys.createdAt} desc`)
          .limit(1);

        if (!spk) return null;

        // Atomically consume one OTP
        let opk: { keyId: number; publicKey: string } | null = null;
        await db.transaction(async (tx) => {
          const [oldest] = await tx
            .select({
              id: oneTimePreKeys.id,
              keyId: oneTimePreKeys.keyId,
              publicKey: oneTimePreKeys.publicKey,
            })
            .from(oneTimePreKeys)
            .where(and(eq(oneTimePreKeys.deviceId, device.id), eq(oneTimePreKeys.used, false)))
            .orderBy(sql`${oneTimePreKeys.createdAt} asc`)
            .limit(1);

          if (oldest) {
            await tx
              .update(oneTimePreKeys)
              .set({ used: true })
              .where(eq(oneTimePreKeys.id, oldest.id));
            opk = { keyId: oldest.keyId, publicKey: oldest.publicKey };
          }
        });

        return {
          deviceUuid: device.id,
          deviceId: device.deviceId,
          registrationId: device.registrationId,
          identityKeyPublic: device.identityKeyPublic,
          signedPreKeyId: spk.keyId,
          signedPreKeyPublic: spk.publicKey,
          signedPreKeySignature: spk.signature,
          oneTimePreKeyId: opk?.keyId ?? null,
          oneTimePreKeyPublic: opk?.publicKey ?? null,
        };
      }),
    );

    // Filter out devices without signed prekeys
    const validBundles = bundles.filter(Boolean);

    return apiSuccess({ bundles: validBundles });
  } catch (e) {
    if (e instanceof NextResponse) return e;
    throw e;
  }
}
