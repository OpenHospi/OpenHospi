"use server";

import { and, desc, eq, sql } from "drizzle-orm";

import { db } from "@/lib/db";
import {
  devices,
  oneTimePreKeys,
  privateKeyBackups,
  senderKeyDistributions,
  signedPreKeys,
} from "@/lib/db/schema";

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
    // Insert device (UUID auto-generated as PK)
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
  return await db
    .select({
      id: devices.id,
      registrationId: devices.registrationId,
      identityKeyPublic: devices.identityKeyPublic,
      signingKeyPublic: devices.signingKeyPublic,
      platform: devices.platform,
    })
    .from(devices)
    .where(and(eq(devices.userId, userId), eq(devices.isActive, true)));
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
