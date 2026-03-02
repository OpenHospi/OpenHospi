"use server";

import { db, withRLS } from "@openhospi/database";
import { encryptionCredentials } from "@openhospi/database/schema";
import {
  generateAuthenticationOptions,
  generateRegistrationOptions,
  verifyAuthenticationResponse,
  verifyRegistrationResponse,
} from "@simplewebauthn/server";
import type { AuthenticationResponseJSON, RegistrationResponseJSON } from "@simplewebauthn/server";
import { eq } from "drizzle-orm";
import { cookies } from "next/headers";

import { requireSession } from "@/lib/auth-server";

const RP_NAME = "OpenHospi";

function getRpId(): string {
  const url = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  return new URL(url).hostname;
}

function getOrigin(): string {
  return process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
}

const CHALLENGE_COOKIE = "webauthn_challenge";

async function storeChallenge(challenge: string) {
  const jar = await cookies();
  jar.set(CHALLENGE_COOKIE, challenge, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 300, // 5 minutes
    path: "/",
  });
}

async function consumeChallenge(): Promise<string> {
  const jar = await cookies();
  const challenge = jar.get(CHALLENGE_COOKIE)?.value;
  if (!challenge) throw new Error("No WebAuthn challenge found");
  jar.delete(CHALLENGE_COOKIE);
  return challenge;
}

export async function generatePasskeyRegistration() {
  const session = await requireSession();
  const rpId = getRpId();

  const options = await generateRegistrationOptions({
    rpName: RP_NAME,
    rpID: rpId,
    userName: session.user.email || session.user.id,
    userID: new TextEncoder().encode(session.user.id),
    attestationType: "none",
    authenticatorSelection: {
      residentKey: "preferred",
      userVerification: "preferred",
    },
    extensions: { prf: {} } as Record<string, unknown>,
  });

  await storeChallenge(options.challenge);

  return options;
}

export async function verifyPasskeyRegistration(response: RegistrationResponseJSON) {
  const session = await requireSession();
  const expectedChallenge = await consumeChallenge();

  const verification = await verifyRegistrationResponse({
    response,
    expectedChallenge,
    expectedOrigin: getOrigin(),
    expectedRPID: getRpId(),
  });

  if (!verification.verified || !verification.registrationInfo) {
    throw new Error("WebAuthn registration verification failed");
  }

  const { credential } = verification.registrationInfo;
  const credId = crypto.randomUUID();

  // Store credential — upsert since one credential per user
  await db
    .insert(encryptionCredentials)
    .values({
      id: credId,
      userId: session.user.id,
      credentialId: credential.id,
      publicKey: Buffer.from(credential.publicKey).toString("base64url"),
      counter: credential.counter,
      transports: credential.transports?.join(",") ?? null,
    })
    .onConflictDoUpdate({
      target: encryptionCredentials.userId,
      set: {
        credentialId: credential.id,
        publicKey: Buffer.from(credential.publicKey).toString("base64url"),
        counter: credential.counter,
        transports: credential.transports?.join(",") ?? null,
      },
    });

  return { verified: true };
}

export async function generatePasskeyAuthentication() {
  const session = await requireSession();

  // Fetch stored credential for allowCredentials
  const [cred] = await withRLS(session.user.id, (tx) =>
    tx
      .select({
        credentialId: encryptionCredentials.credentialId,
        transports: encryptionCredentials.transports,
      })
      .from(encryptionCredentials)
      .where(eq(encryptionCredentials.userId, session.user.id)),
  );

  if (!cred) throw new Error("No encryption credential found");

  const options = await generateAuthenticationOptions({
    rpID: getRpId(),
    userVerification: "preferred",
    allowCredentials: [
      {
        id: cred.credentialId,
        transports: (cred.transports?.split(",") ?? []) as AuthenticatorTransport[],
      },
    ],
  });

  await storeChallenge(options.challenge);

  return options;
}

export async function verifyPasskeyAuthentication(response: AuthenticationResponseJSON) {
  const session = await requireSession();
  const expectedChallenge = await consumeChallenge();

  const [cred] = await withRLS(session.user.id, (tx) =>
    tx
      .select({
        credentialId: encryptionCredentials.credentialId,
        publicKey: encryptionCredentials.publicKey,
        counter: encryptionCredentials.counter,
      })
      .from(encryptionCredentials)
      .where(eq(encryptionCredentials.userId, session.user.id)),
  );

  if (!cred) throw new Error("No encryption credential found");

  const verification = await verifyAuthenticationResponse({
    response,
    expectedChallenge,
    expectedOrigin: getOrigin(),
    expectedRPID: getRpId(),
    credential: {
      id: cred.credentialId,
      publicKey: Buffer.from(cred.publicKey, "base64url"),
      counter: cred.counter,
    },
  });

  if (!verification.verified) {
    throw new Error("WebAuthn authentication verification failed");
  }

  // Update counter
  await db
    .update(encryptionCredentials)
    .set({ counter: verification.authenticationInfo.newCounter })
    .where(eq(encryptionCredentials.userId, session.user.id));

  return { verified: true };
}
