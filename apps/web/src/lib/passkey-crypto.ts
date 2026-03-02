"use client";

import { startAuthentication, startRegistration } from "@simplewebauthn/browser";
import type {
  AuthenticationResponseJSON,
  PublicKeyCredentialCreationOptionsJSON,
  PublicKeyCredentialRequestOptionsJSON,
  RegistrationResponseJSON,
} from "@simplewebauthn/browser";

export async function isPRFSupported(): Promise<boolean> {
  if (
    typeof window === "undefined" ||
    !window.PublicKeyCredential ||
    !PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable
  ) {
    return false;
  }

  try {
    // Platform authenticator availability is a proxy for PRF support.
    // Actual PRF support can only be confirmed during registration.
    return await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
  } catch {
    return false;
  }
}

export async function registerEncryptionPasskey(
  registrationOptions: PublicKeyCredentialCreationOptionsJSON,
): Promise<{
  response: RegistrationResponseJSON;
  prfOutput: ArrayBuffer | null;
}> {
  // Add PRF extension to the options
  const optionsWithPRF = {
    ...registrationOptions,
    extensions: {
      ...(registrationOptions.extensions ?? {}),
      prf: {},
    },
  };

  const response = await startRegistration({ optionsJSON: optionsWithPRF });

  // Extract PRF output from client extension results
  const prfResult = (
    response.clientExtensionResults as Record<string, unknown> & {
      prf?: { results?: { first?: ArrayBuffer } };
    }
  )?.prf;
  const prfOutput = prfResult?.results?.first ?? null;

  return { response, prfOutput };
}

export async function authenticateEncryptionPasskey(
  authOptions: PublicKeyCredentialRequestOptionsJSON,
  prfSalt: Uint8Array,
): Promise<{
  response: AuthenticationResponseJSON;
  prfOutput: ArrayBuffer;
}> {
  // Add PRF eval extension to the options
  const optionsWithPRF = {
    ...authOptions,
    extensions: {
      ...(authOptions.extensions ?? {}),
      prf: { eval: { first: prfSalt } },
    },
  };

  const response = await startAuthentication({ optionsJSON: optionsWithPRF });

  const prfResult = (
    response.clientExtensionResults as Record<string, unknown> & {
      prf?: { results?: { first?: ArrayBuffer } };
    }
  )?.prf;
  const prfOutput = prfResult?.results?.first;

  if (!prfOutput) {
    throw new Error("PRF output not available — passkey may not support PRF extension");
  }

  return { response, prfOutput };
}
