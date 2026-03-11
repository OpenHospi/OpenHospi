/**
 * KDF chain operations for the Double Ratchet.
 *
 * Each chain step derives a new chain key and a message key from the current chain key.
 * This provides forward secrecy: once a message key is used, the chain key advances
 * and the old message key cannot be re-derived.
 */
import type { CryptoBackend } from "../backends/platform";

const CHAIN_KEY_INFO = new TextEncoder().encode("OpenHospiChainKey");
const MESSAGE_KEY_INFO = new TextEncoder().encode("OpenHospiMessageKey");
const KDF_SALT = new Uint8Array(32); // zeros

/**
 * Advance the KDF chain by one step.
 * Returns the next chain key and a message key for this step.
 */
export async function kdfChainStep(
  backend: CryptoBackend,
  chainKey: Uint8Array,
): Promise<{ nextChainKey: Uint8Array; messageKey: Uint8Array }> {
  const [nextChainKey, messageKey] = await Promise.all([
    backend.hkdf(chainKey, KDF_SALT, CHAIN_KEY_INFO, 32),
    backend.hkdf(chainKey, KDF_SALT, MESSAGE_KEY_INFO, 32),
  ]);
  return { nextChainKey, messageKey };
}

/**
 * Derive root key and chain key from a DH ratchet step.
 * Input is the current root key and the DH shared secret.
 */
export async function kdfRootStep(
  backend: CryptoBackend,
  rootKey: Uint8Array,
  dhOutput: Uint8Array,
): Promise<{ newRootKey: Uint8Array; chainKey: Uint8Array }> {
  const derived = await backend.hkdf(
    dhOutput,
    rootKey,
    new TextEncoder().encode("OpenHospiRatchet"),
    64,
  );
  return {
    newRootKey: derived.slice(0, 32),
    chainKey: derived.slice(32, 64),
  };
}
