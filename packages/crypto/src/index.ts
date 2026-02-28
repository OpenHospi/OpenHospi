/**
 * E2EE: P-256 ECDH key exchange + AES-256-GCM encrypt/decrypt
 *
 * Uses Web Crypto API exclusively. Compatible with browsers and Node.js 20+.
 *
 * Flow:
 *   Sender → generateKeyPair() → store private locally (IndexedDB)
 *   Sender → upload public key (JWK) to server
 *   Sender → encryptForGroup(plaintext, senderPrivateKey, recipientPublicKeys)
 *   Server → stores { ciphertext, iv, encryptedKeys[] }
 *   Recipient → decryptFromGroup(ciphertext, iv, encryptedKeys, myUserId, myPrivateKey, senderPublicKey)
 */

const ALGO_ECDH = { name: "ECDH", namedCurve: "P-256" } as const;
const ALGO_AES = { name: "AES-GCM", length: 256 } as const;
const ALGO_HKDF = { name: "HKDF", hash: "SHA-256", info: new Uint8Array(0), salt: new Uint8Array(0) } as const;

// ── Key Generation ──

export async function generateKeyPair(): Promise<CryptoKeyPair> {
  return crypto.subtle.generateKey(ALGO_ECDH, true, ["deriveBits"]);
}

// ── Key Export / Import (JWK) ──

export async function exportPublicKey(key: CryptoKey): Promise<JsonWebKey> {
  return crypto.subtle.exportKey("jwk", key);
}

export async function importPublicKey(jwk: JsonWebKey): Promise<CryptoKey> {
  return crypto.subtle.importKey("jwk", jwk, ALGO_ECDH, true, []);
}

export async function exportPrivateKey(key: CryptoKey): Promise<JsonWebKey> {
  return crypto.subtle.exportKey("jwk", key);
}

export async function importPrivateKey(jwk: JsonWebKey): Promise<CryptoKey> {
  return crypto.subtle.importKey("jwk", jwk, ALGO_ECDH, true, ["deriveBits"]);
}

// ── Key Derivation (ECDH → HKDF → AES) ──

async function deriveSharedKey(
  myPrivateKey: CryptoKey,
  theirPublicKey: CryptoKey,
): Promise<CryptoKey> {
  const sharedBits = await crypto.subtle.deriveBits(
    { name: "ECDH", public: theirPublicKey },
    myPrivateKey,
    256,
  );

  const hkdfKey = await crypto.subtle.importKey("raw", sharedBits, "HKDF", false, ["deriveKey"]);

  return crypto.subtle.deriveKey(
    ALGO_HKDF,
    hkdfKey,
    ALGO_AES,
    false,
    ["encrypt", "decrypt"],
  );
}

// ── AES-GCM Encrypt / Decrypt ──

async function aesEncrypt(
  key: CryptoKey,
  plaintext: Uint8Array<ArrayBuffer>,
  iv: Uint8Array<ArrayBuffer>,
): Promise<ArrayBuffer> {
  return crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, plaintext);
}

async function aesDecrypt(
  key: CryptoKey,
  ciphertext: Uint8Array<ArrayBuffer>,
  iv: Uint8Array<ArrayBuffer>,
): Promise<ArrayBuffer> {
  return crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, ciphertext);
}

// ── Helpers ──

export function toBase64(buf: ArrayBuffer | Uint8Array<ArrayBuffer>): string {
  const bytes = buf instanceof ArrayBuffer ? new Uint8Array(buf) : buf;
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary);
}

export function fromBase64(str: string): Uint8Array<ArrayBuffer> {
  const binary = atob(str);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

// ── Group Encryption ──

export type EncryptedKey = {
  userId: string;
  wrappedKey: string; // base64
};

export type EncryptedMessage = {
  ciphertext: string; // base64
  iv: string; // base64
  encryptedKeys: EncryptedKey[];
};

/**
 * Encrypt plaintext for a group of recipients.
 *
 * Generates a random per-message AES key, encrypts the message,
 * then wraps that AES key for each recipient using ECDH shared secrets.
 */
export async function encryptForGroup(
  plaintext: string,
  senderPrivateKey: CryptoKey,
  recipientPublicKeys: { userId: string; publicKey: CryptoKey }[],
): Promise<EncryptedMessage> {
  // Generate random per-message AES key
  const messageKey = await crypto.subtle.generateKey(ALGO_AES, true, ["encrypt", "decrypt"]);
  const rawMessageKey = await crypto.subtle.exportKey("raw", messageKey);

  // Encrypt the plaintext
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encoder = new TextEncoder();
  const ciphertextBuf = await aesEncrypt(messageKey, encoder.encode(plaintext), iv);

  // Wrap the message key for each recipient
  const encryptedKeys: EncryptedKey[] = [];
  for (const { userId, publicKey } of recipientPublicKeys) {
    const sharedKey = await deriveSharedKey(senderPrivateKey, publicKey);
    const wrappedIv = crypto.getRandomValues(new Uint8Array(12));
    const wrappedBuf = await aesEncrypt(sharedKey, new Uint8Array(rawMessageKey), wrappedIv);

    // Concatenate wrappedIv + wrappedCiphertext for storage
    const combined = new Uint8Array(wrappedIv.length + wrappedBuf.byteLength);
    combined.set(wrappedIv);
    combined.set(new Uint8Array(wrappedBuf), wrappedIv.length);

    encryptedKeys.push({ userId, wrappedKey: toBase64(combined) });
  }

  return {
    ciphertext: toBase64(ciphertextBuf),
    iv: toBase64(iv),
    encryptedKeys,
  };
}

/**
 * Decrypt a message encrypted for a group.
 *
 * Finds the recipient's wrapped key, unwraps it using the ECDH shared secret,
 * then decrypts the message.
 */
export async function decryptFromGroup(
  ciphertext: string,
  iv: string,
  encryptedKeys: EncryptedKey[],
  myUserId: string,
  myPrivateKey: CryptoKey,
  senderPublicKey: CryptoKey,
): Promise<string> {
  const myEncryptedKey = encryptedKeys.find((k) => k.userId === myUserId);
  if (!myEncryptedKey) {
    throw new Error("No encrypted key found for this user");
  }

  // Derive the shared key with sender
  const sharedKey = await deriveSharedKey(myPrivateKey, senderPublicKey);

  // Split wrappedIv + wrappedCiphertext
  const combined = fromBase64(myEncryptedKey.wrappedKey);
  const wrappedIv = new Uint8Array(combined.buffer, 0, 12);
  const wrappedCiphertext = new Uint8Array(combined.buffer, 12);

  // Unwrap the per-message AES key
  const rawMessageKey = await aesDecrypt(sharedKey, wrappedCiphertext, wrappedIv);

  // Import the message key
  const messageKey = await crypto.subtle.importKey("raw", rawMessageKey, ALGO_AES, false, [
    "decrypt",
  ]);

  // Decrypt the message
  const plaintextBuf = await aesDecrypt(messageKey, fromBase64(ciphertext), fromBase64(iv));
  return new TextDecoder().decode(plaintextBuf);
}

// ── Backup Encrypt / Decrypt ──

export type BackupData = {
  encryptedPrivateKey: string;
  backupIv: string;
  backupKey: string;
};

export async function createBackup(privateKeyJwk: JsonWebKey): Promise<BackupData> {
  const backupKey = await crypto.subtle.generateKey(ALGO_AES, true, ["encrypt", "decrypt"]);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encoded = new TextEncoder().encode(JSON.stringify(privateKeyJwk));
  const encrypted = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, backupKey, encoded);
  const rawKey = await crypto.subtle.exportKey("raw", backupKey);

  return {
    encryptedPrivateKey: toBase64(encrypted),
    backupIv: toBase64(iv),
    backupKey: toBase64(rawKey),
  };
}

export async function decryptBackup(backup: BackupData): Promise<JsonWebKey> {
  const rawKey = fromBase64(backup.backupKey);
  const key = await crypto.subtle.importKey("raw", rawKey, ALGO_AES, false, ["decrypt"]);
  const iv = fromBase64(backup.backupIv);
  const ciphertext = fromBase64(backup.encryptedPrivateKey);
  const decrypted = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, ciphertext);

  return JSON.parse(new TextDecoder().decode(decrypted));
}
