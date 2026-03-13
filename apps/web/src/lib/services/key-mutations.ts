import { and, eq, sql } from "drizzle-orm";

import { db, createDrizzleSupabaseClient } from "@/lib/db";
import {
  devices,
  oneTimePreKeys,
  privateKeyBackups,
  senderKeyDistributions,
  signedPreKeys,
} from "@/lib/db/schema";

// ── Devices ──

export async function registerDevice(
  userId: string,
  data: {
    deviceId: number;
    registrationId: number;
    identityKeyPublic: string;
    platform: "web" | "ios" | "android";
    pushToken?: string;
  },
) {
  const [device] = await db
    .insert(devices)
    .values({ userId, ...data })
    .onConflictDoUpdate({
      target: [devices.userId, devices.deviceId],
      set: {
        registrationId: data.registrationId,
        identityKeyPublic: data.identityKeyPublic,
        platform: data.platform,
        pushToken: data.pushToken ?? null,
        lastSeenAt: new Date(),
        isActive: true,
      },
    })
    .returning();
  return device;
}

export async function getDevicesForUser(requestingUserId: string, targetUserId: string) {
  return createDrizzleSupabaseClient(requestingUserId).rls((tx) =>
    tx
      .select({
        id: devices.id,
        deviceId: devices.deviceId,
        registrationId: devices.registrationId,
        identityKeyPublic: devices.identityKeyPublic,
        platform: devices.platform,
      })
      .from(devices)
      .where(and(eq(devices.userId, targetUserId), eq(devices.isActive, true))),
  );
}

export async function deactivateDevice(userId: string, deviceUuid: string) {
  await db
    .update(devices)
    .set({ isActive: false })
    .where(and(eq(devices.id, deviceUuid), eq(devices.userId, userId)));
}

// ── Signed Pre-Keys ──

export async function insertSignedPreKey(
  deviceUuid: string,
  data: { keyId: number; publicKey: string; signature: string },
) {
  await db.insert(signedPreKeys).values({ deviceId: deviceUuid, ...data });
}

// ── One-Time Pre-Keys ──

export async function insertOneTimePreKeys(
  deviceUuid: string,
  keys: { keyId: number; publicKey: string }[],
) {
  if (keys.length === 0) return;
  await db.insert(oneTimePreKeys).values(keys.map((k) => ({ deviceId: deviceUuid, ...k })));
}

export async function getOneTimePreKeyCount(deviceUuid: string): Promise<number> {
  const [result] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(oneTimePreKeys)
    .where(and(eq(oneTimePreKeys.deviceId, deviceUuid), eq(oneTimePreKeys.used, false)));
  return result?.count ?? 0;
}

/**
 * Fetch a device's pre-key bundle for X3DH session establishment.
 * Marks one OPK as used (sets used=true after fetching).
 * Runs with db directly (server-side operation, bypasses RLS).
 */
export async function getPreKeyBundle(targetDeviceUuid: string): Promise<{
  deviceId: string;
  registrationId: number;
  identityKeyPublic: string;
  signedPreKeyId: number;
  signedPreKeyPublic: string;
  signedPreKeySignature: string;
  oneTimePreKeyId?: number;
  oneTimePreKeyPublic?: string;
} | null> {
  // Get device info (identity key is on the device)
  const [device] = await db
    .select({
      id: devices.id,
      registrationId: devices.registrationId,
      identityKeyPublic: devices.identityKeyPublic,
    })
    .from(devices)
    .where(and(eq(devices.id, targetDeviceUuid), eq(devices.isActive, true)));

  if (!device) return null;

  // Get latest signed pre-key for this device
  const [spk] = await db
    .select({
      keyId: signedPreKeys.keyId,
      publicKey: signedPreKeys.publicKey,
      signature: signedPreKeys.signature,
    })
    .from(signedPreKeys)
    .where(eq(signedPreKeys.deviceId, targetDeviceUuid))
    .orderBy(sql`${signedPreKeys.createdAt} desc`)
    .limit(1);

  if (!spk) return null;

  // Atomically consume one OPK (fetch + mark used in transaction)
  let opk: { keyId: number; publicKey: string } | undefined;
  await db.transaction(async (tx) => {
    const [oldest] = await tx
      .select({
        id: oneTimePreKeys.id,
        keyId: oneTimePreKeys.keyId,
        publicKey: oneTimePreKeys.publicKey,
      })
      .from(oneTimePreKeys)
      .where(and(eq(oneTimePreKeys.deviceId, targetDeviceUuid), eq(oneTimePreKeys.used, false)))
      .orderBy(sql`${oneTimePreKeys.createdAt} asc`)
      .limit(1);

    if (oldest) {
      await tx.update(oneTimePreKeys).set({ used: true }).where(eq(oneTimePreKeys.id, oldest.id));
      opk = { keyId: oldest.keyId, publicKey: oldest.publicKey };
    }
  });

  return {
    deviceId: device.id,
    registrationId: device.registrationId,
    identityKeyPublic: device.identityKeyPublic,
    signedPreKeyId: spk.keyId,
    signedPreKeyPublic: spk.publicKey,
    signedPreKeySignature: spk.signature,
    oneTimePreKeyId: opk?.keyId,
    oneTimePreKeyPublic: opk?.publicKey,
  };
}

// ── Private Key Backups ──

export async function upsertKeyBackup(
  userId: string,
  data: { encryptedPrivateKey: string; backupIv: string; salt: string },
) {
  const now = new Date();
  await db
    .insert(privateKeyBackups)
    .values({ userId, ...data, updatedAt: now })
    .onConflictDoUpdate({
      target: privateKeyBackups.userId,
      set: { ...data, updatedAt: now },
    });
}

export async function getKeyBackup(userId: string) {
  const [backup] = await createDrizzleSupabaseClient(userId).rls((tx) =>
    tx
      .select({
        encryptedPrivateKey: privateKeyBackups.encryptedPrivateKey,
        backupIv: privateKeyBackups.backupIv,
        salt: privateKeyBackups.salt,
        createdAt: privateKeyBackups.createdAt,
      })
      .from(privateKeyBackups)
      .where(eq(privateKeyBackups.userId, userId)),
  );
  return backup ?? null;
}

export async function removeKeyBackup(userId: string) {
  await db.delete(privateKeyBackups).where(eq(privateKeyBackups.userId, userId));
}

// ── Sender Key Distributions ──

export async function insertSenderKeyDistribution(
  conversationId: string,
  senderUserId: string,
  senderDeviceId: string,
  recipientDeviceId: string,
  ciphertext: string,
) {
  await db
    .insert(senderKeyDistributions)
    .values({
      conversationId,
      senderUserId,
      senderDeviceId,
      recipientDeviceId,
      ciphertext,
    })
    .onConflictDoUpdate({
      target: [
        senderKeyDistributions.conversationId,
        senderKeyDistributions.senderDeviceId,
        senderKeyDistributions.recipientDeviceId,
      ],
      set: {
        ciphertext,
        status: "pending",
        createdAt: new Date(),
        deliveredAt: null,
      },
    });
}

export async function getPendingSenderKeyDistributions(recipientDeviceId: string) {
  return db
    .select({
      id: senderKeyDistributions.id,
      conversationId: senderKeyDistributions.conversationId,
      senderUserId: senderKeyDistributions.senderUserId,
      senderDeviceId: senderKeyDistributions.senderDeviceId,
      ciphertext: senderKeyDistributions.ciphertext,
    })
    .from(senderKeyDistributions)
    .where(
      and(
        eq(senderKeyDistributions.recipientDeviceId, recipientDeviceId),
        eq(senderKeyDistributions.status, "pending"),
      ),
    );
}

export async function markDistributionDelivered(distributionId: string) {
  await db
    .update(senderKeyDistributions)
    .set({ status: "delivered", deliveredAt: new Date() })
    .where(eq(senderKeyDistributions.id, distributionId));
}
