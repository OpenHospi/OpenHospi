"use server";

import { db } from "@openhospi/database";
import {
  devices,
  oneTimePreKeys,
  privateKeyBackups,
  senderKeyDistributions,
  signedPreKeys,
} from "@openhospi/database/schema";
import { and, desc, eq, inArray, sql } from "drizzle-orm";

// ── Device Registration ──

export async function registerDevice(data: {
  userId: string;
  registrationId: number;
  identityKeyPublic: string;
  signingKeyPublic: string;
  platform: "web" | "ios" | "android";
  signedPreKey: { keyId: number; publicKey: string; signature: string };
  oneTimePreKeys: Array<{ keyId: number; publicKey: string }>;
}) {
  return await db.transaction(async (tx) => {
    // Deactivate any existing devices for the same user+platform
    await tx
      .update(devices)
      .set({ isActive: false })
      .where(
        and(
          eq(devices.userId, data.userId),
          eq(devices.platform, data.platform),
          eq(devices.isActive, true),
        ),
      );

    // Insert new device (UUID auto-generated as PK)
    const [device] = await tx
      .insert(devices)
      .values({
        userId: data.userId,
        registrationId: data.registrationId,
        identityKeyPublic: data.identityKeyPublic,
        signingKeyPublic: data.signingKeyPublic,
        platform: data.platform,
      })
      .returning();

    // Insert signed pre-key
    await tx
      .insert(signedPreKeys)
      .values({
        deviceId: device.id,
        keyId: data.signedPreKey.keyId,
        publicKey: data.signedPreKey.publicKey,
        signature: data.signedPreKey.signature,
      })
      .onConflictDoUpdate({
        target: [signedPreKeys.deviceId, signedPreKeys.keyId],
        set: {
          publicKey: data.signedPreKey.publicKey,
          signature: data.signedPreKey.signature,
        },
      });

    // Batch insert one-time pre-keys
    if (data.oneTimePreKeys.length > 0) {
      await tx
        .insert(oneTimePreKeys)
        .values(
          data.oneTimePreKeys.map((pk) => ({
            deviceId: device.id,
            keyId: pk.keyId,
            publicKey: pk.publicKey,
          })),
        )
        .onConflictDoNothing();
    }

    return device;
  });
}

// ── Pre-Key Bundle ──

export async function fetchPreKeyBundle(targetDeviceId: string) {
  return await db.transaction(async (tx) => {
    const [device] = await tx
      .select({
        id: devices.id,
        userId: devices.userId,
        registrationId: devices.registrationId,
        identityKeyPublic: devices.identityKeyPublic,
        signingKeyPublic: devices.signingKeyPublic,
      })
      .from(devices)
      .where(and(eq(devices.id, targetDeviceId), eq(devices.isActive, true)));

    if (!device) return null;

    // Fetch latest signed pre-key (newest first)
    const [spk] = await tx
      .select()
      .from(signedPreKeys)
      .where(eq(signedPreKeys.deviceId, device.id))
      .orderBy(desc(signedPreKeys.createdAt))
      .limit(1);

    if (!spk) return null;

    // Atomically fetch and consume one unused OTP
    const [otpk] = await tx
      .update(oneTimePreKeys)
      .set({ used: true })
      .where(
        eq(
          oneTimePreKeys.id,
          tx
            .select({ id: oneTimePreKeys.id })
            .from(oneTimePreKeys)
            .where(and(eq(oneTimePreKeys.deviceId, device.id), eq(oneTimePreKeys.used, false)))
            .limit(1),
        ),
      )
      .returning();

    return {
      deviceId: device.id,
      userId: device.userId,
      registrationId: device.registrationId,
      identityKeyPublic: device.identityKeyPublic,
      signingKeyPublic: device.signingKeyPublic,
      signedPreKeyId: spk.keyId,
      signedPreKeyPublic: spk.publicKey,
      signedPreKeySignature: spk.signature,
      oneTimePreKeyId: otpk?.keyId,
      oneTimePreKeyPublic: otpk?.publicKey,
    };
  });
}

// ── Pre-Key Replenishment ──

export async function replenishOneTimePreKeys(
  deviceId: string,
  keys: Array<{ keyId: number; publicKey: string }>,
) {
  if (keys.length === 0) return;
  await db
    .insert(oneTimePreKeys)
    .values(keys.map((pk) => ({ deviceId, keyId: pk.keyId, publicKey: pk.publicKey })))
    .onConflictDoNothing();
}

export async function rotateSignedPreKey(
  deviceId: string,
  data: { keyId: number; publicKey: string; signature: string },
) {
  await db
    .insert(signedPreKeys)
    .values({
      deviceId,
      keyId: data.keyId,
      publicKey: data.publicKey,
      signature: data.signature,
    })
    .onConflictDoUpdate({
      target: [signedPreKeys.deviceId, signedPreKeys.keyId],
      set: { publicKey: data.publicKey, signature: data.signature },
    });
}

// ── Device Queries ──

export async function getDevicesForUser(userId: string) {
  // Only return the latest active device per platform to handle stale duplicates.
  // Uses DISTINCT ON (platform) ordered by created_at DESC to pick the newest device.
  const rows = await db.execute(sql`
    SELECT DISTINCT ON (platform)
      id, registration_id, identity_key_public, signing_key_public, platform
    FROM devices
    WHERE user_id = ${userId} AND is_active = true
    ORDER BY platform, created_at DESC
  `);

  return rows.map((row) => ({
    id: row.id as string,
    registrationId: row.registration_id as number,
    identityKeyPublic: row.identity_key_public as string,
    signingKeyPublic: row.signing_key_public as string,
    platform: row.platform as string,
  }));
}

export async function getOneTimePreKeyCount(deviceId: string) {
  const [result] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(oneTimePreKeys)
    .where(and(eq(oneTimePreKeys.deviceId, deviceId), eq(oneTimePreKeys.used, false)));
  return result.count;
}

// ── Key Backup ──

export async function upsertKeyBackup(data: {
  userId: string;
  encryptedData: string;
  iv: string;
  salt: string;
}) {
  await db
    .insert(privateKeyBackups)
    .values(data)
    .onConflictDoUpdate({
      target: [privateKeyBackups.userId],
      set: {
        encryptedData: data.encryptedData,
        iv: data.iv,
        salt: data.salt,
        updatedAt: new Date(),
      },
    });
}

export async function getKeyBackup(userId: string) {
  const [backup] = await db
    .select()
    .from(privateKeyBackups)
    .where(eq(privateKeyBackups.userId, userId));
  return backup ?? null;
}

export async function removeKeyBackup(userId: string) {
  await db.delete(privateKeyBackups).where(eq(privateKeyBackups.userId, userId));
}

// ── Identity Key Queries ──

export async function getIdentityKeysForUsers(userIds: string[]) {
  if (userIds.length === 0) return [];

  // Query one device per user — latest active device, matching getDevicesForUser pattern.
  // Use subquery approach since Drizzle query builder doesn't support DISTINCT ON.
  const results = await db
    .selectDistinctOn([devices.userId], {
      userId: devices.userId,
      identityPublicKey: devices.identityKeyPublic,
      signingPublicKey: devices.signingKeyPublic,
    })
    .from(devices)
    .where(and(inArray(devices.userId, userIds), eq(devices.isActive, true)))
    .orderBy(devices.userId, desc(devices.createdAt));

  return results;
}

// ── Sender Key Distributions ──

export async function storeSenderKeyDistribution(data: {
  conversationId: string;
  senderUserId: string;
  senderDeviceId: string;
  recipientDeviceId: string;
  ciphertext: string;
}) {
  const [row] = await db.insert(senderKeyDistributions).values(data).returning();
  return row;
}

export async function fetchPendingDistributions(recipientDeviceId: string) {
  return await db
    .select({
      id: senderKeyDistributions.id,
      conversationId: senderKeyDistributions.conversationId,
      senderUserId: senderKeyDistributions.senderUserId,
      senderDeviceId: senderKeyDistributions.senderDeviceId,
      recipientDeviceId: senderKeyDistributions.recipientDeviceId,
      ciphertext: senderKeyDistributions.ciphertext,
      status: senderKeyDistributions.status,
      createdAt: senderKeyDistributions.createdAt,
    })
    .from(senderKeyDistributions)
    .where(
      and(
        eq(senderKeyDistributions.recipientDeviceId, recipientDeviceId),
        eq(senderKeyDistributions.status, "pending"),
      ),
    )
    .orderBy(senderKeyDistributions.createdAt);
}

export async function acknowledgeDistribution(id: string) {
  await db
    .update(senderKeyDistributions)
    .set({ status: "delivered", deliveredAt: new Date() })
    .where(eq(senderKeyDistributions.id, id));
}
