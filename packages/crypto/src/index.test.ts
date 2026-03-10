import { beforeAll, describe, expect, it } from "vitest";

import { createWebBackend } from "./backend-web";
import type { PreKeyBundle } from "./types";

import {
  // Platform
  setBackend,
  getBackend,

  // Encoding
  toBase64,
  fromBase64,
  concatBytes,
  bytesEqual,

  // Keys
  generateIdentityKeyPair,
  generateSignedPreKey,
  generateOneTimePreKeys,
  verifySignedPreKey,

  // X3DH
  x3dhInitiate,
  x3dhRespond,

  // Double Ratchet
  initializeSender,
  initializeReceiver,
  ratchetEncrypt,
  ratchetDecrypt,
  serializeRatchetState,
  deserializeRatchetState,

  // Encryption
  encrypt,
  decrypt,
  encodeHeaderAsAad,

  // Safety Numbers
  generateSafetyNumber,

  // Backup
  deriveKeyFromPIN,
  encryptIdentityBackup,
  decryptIdentityBackup,
} from "./index";

// ── Setup ──

beforeAll(() => {
  setBackend(createWebBackend());
});

// ── Encoding ──

describe("encoding helpers", () => {
  it("toBase64/fromBase64 roundtrip", () => {
    const original = new Uint8Array([1, 2, 3, 4, 5]);
    const encoded = toBase64(original);
    const decoded = fromBase64(encoded);
    expect(decoded).toEqual(original);
  });

  it("handles empty buffer", () => {
    const empty = new Uint8Array(0);
    expect(toBase64(empty)).toBe("");
    expect(fromBase64("")).toEqual(new Uint8Array(0));
  });

  it("handles large buffer (1KB)", () => {
    const large = new Uint8Array(1024);
    for (let i = 0; i < 1024; i++) large[i] = i % 256;
    const decoded = fromBase64(toBase64(large));
    expect(decoded).toEqual(large);
  });

  it("concatBytes joins arrays", () => {
    const result = concatBytes(new Uint8Array([1, 2]), new Uint8Array([3, 4, 5]));
    expect(result).toEqual(new Uint8Array([1, 2, 3, 4, 5]));
  });

  it("bytesEqual works correctly", () => {
    expect(bytesEqual(new Uint8Array([1, 2, 3]), new Uint8Array([1, 2, 3]))).toBe(true);
    expect(bytesEqual(new Uint8Array([1, 2, 3]), new Uint8Array([1, 2, 4]))).toBe(false);
    expect(bytesEqual(new Uint8Array([1, 2, 3]), new Uint8Array([1, 2]))).toBe(false);
  });
});

// ── Key Generation ──

describe("key generation", () => {
  it("generates Ed25519 identity key pair with X25519 DH keys", () => {
    const backend = getBackend();
    const identity = generateIdentityKeyPair(backend);

    expect(identity.signing.publicKey).toHaveLength(32);
    expect(identity.signing.privateKey).toHaveLength(32);
    expect(identity.dh.publicKey).toHaveLength(32);
    expect(identity.dh.privateKey).toHaveLength(32);
  });

  it("generates unique key pairs each time", () => {
    const backend = getBackend();
    const kp1 = generateIdentityKeyPair(backend);
    const kp2 = generateIdentityKeyPair(backend);
    expect(bytesEqual(kp1.signing.publicKey, kp2.signing.publicKey)).toBe(false);
  });

  it("generates signed pre-key with valid Ed25519 signature", () => {
    const backend = getBackend();
    const identity = generateIdentityKeyPair(backend);
    const spk = generateSignedPreKey(backend, identity.signing.privateKey, 1);

    expect(spk.keyId).toBe(1);
    expect(spk.keyPair.publicKey).toHaveLength(32);
    expect(spk.signature.length).toBeGreaterThan(0);

    const isValid = verifySignedPreKey(
      backend,
      identity.signing.publicKey,
      spk.keyPair.publicKey,
      spk.signature,
    );
    expect(isValid).toBe(true);
  });

  it("rejects tampered signed pre-key signature", () => {
    const backend = getBackend();
    const identity = generateIdentityKeyPair(backend);
    const spk = generateSignedPreKey(backend, identity.signing.privateKey, 1);

    const tamperedSig = new Uint8Array(spk.signature);
    tamperedSig[0] ^= 0xff;

    expect(
      verifySignedPreKey(backend, identity.signing.publicKey, spk.keyPair.publicKey, tamperedSig),
    ).toBe(false);
  });

  it("generates batch of one-time pre-keys", () => {
    const backend = getBackend();
    const opks = generateOneTimePreKeys(backend, 100, 5);

    expect(opks).toHaveLength(5);
    expect(opks[0].keyId).toBe(100);
    expect(opks[4].keyId).toBe(104);

    const pubs = opks.map((k) => toBase64(k.keyPair.publicKey));
    expect(new Set(pubs).size).toBe(5);
  });
});

// ── X3DH Key Exchange ──

describe("X3DH key exchange", () => {
  it("establishes shared secret between initiator and responder (with OPK)", async () => {
    const backend = getBackend();
    const alice = generateIdentityKeyPair(backend);
    const bob = generateIdentityKeyPair(backend);
    const spk = generateSignedPreKey(backend, bob.signing.privateKey, 1);
    const [opk] = generateOneTimePreKeys(backend, 1, 1);

    const bundle: PreKeyBundle = {
      identityKey: bob.dh.publicKey,
      signingKey: bob.signing.publicKey,
      signedPreKeyPublic: spk.keyPair.publicKey,
      signedPreKeyId: spk.keyId,
      signedPreKeySignature: spk.signature,
      oneTimePreKeyPublic: opk.keyPair.publicKey,
      oneTimePreKeyId: opk.keyId,
    };

    const aliceResult = await x3dhInitiate(backend, alice, bundle);

    const bobResult = await x3dhRespond(
      backend,
      bob,
      spk.keyPair.privateKey,
      opk.keyPair.privateKey,
      alice.dh.publicKey,
      aliceResult.ephemeralPublicKey,
    );

    expect(bytesEqual(aliceResult.sharedSecret, bobResult)).toBe(true);
  });

  it("establishes shared secret without OPK (3 DH values)", async () => {
    const backend = getBackend();
    const alice = generateIdentityKeyPair(backend);
    const bob = generateIdentityKeyPair(backend);
    const spk = generateSignedPreKey(backend, bob.signing.privateKey, 1);

    const bundle: PreKeyBundle = {
      identityKey: bob.dh.publicKey,
      signingKey: bob.signing.publicKey,
      signedPreKeyPublic: spk.keyPair.publicKey,
      signedPreKeyId: spk.keyId,
      signedPreKeySignature: spk.signature,
    };

    const aliceResult = await x3dhInitiate(backend, alice, bundle);

    const bobResult = await x3dhRespond(
      backend,
      bob,
      spk.keyPair.privateKey,
      null,
      alice.dh.publicKey,
      aliceResult.ephemeralPublicKey,
    );

    expect(bytesEqual(aliceResult.sharedSecret, bobResult)).toBe(true);
  });

  it("rejects bundle with invalid signed pre-key signature", async () => {
    const backend = getBackend();
    const alice = generateIdentityKeyPair(backend);
    const bob = generateIdentityKeyPair(backend);
    const spk = generateSignedPreKey(backend, bob.signing.privateKey, 1);

    const badSig = new Uint8Array(spk.signature);
    badSig[0] ^= 0xff;

    const bundle: PreKeyBundle = {
      identityKey: bob.dh.publicKey,
      signingKey: bob.signing.publicKey,
      signedPreKeyPublic: spk.keyPair.publicKey,
      signedPreKeyId: spk.keyId,
      signedPreKeySignature: badSig,
    };

    await expect(x3dhInitiate(backend, alice, bundle)).rejects.toThrow();
  });
});

// ── AES-256-GCM Encryption ──

describe("AES-256-GCM encryption", () => {
  it("encrypt → decrypt roundtrip", async () => {
    const backend = getBackend();
    const key = backend.randomBytes(32);
    const plaintext = new TextEncoder().encode("Hello, E2EE!");

    const { ciphertext, iv } = await encrypt(backend, key, plaintext);
    const decrypted = await decrypt(backend, key, ciphertext, iv);
    expect(new TextDecoder().decode(decrypted)).toBe("Hello, E2EE!");
  });

  it("encrypt with AAD → decrypt requires same AAD", async () => {
    const backend = getBackend();
    const key = backend.randomBytes(32);
    const plaintext = new TextEncoder().encode("AAD test");
    const aad = new TextEncoder().encode("header-data");

    const { ciphertext, iv } = await encrypt(backend, key, plaintext, aad);

    const decrypted = await decrypt(backend, key, ciphertext, iv, aad);
    expect(new TextDecoder().decode(decrypted)).toBe("AAD test");

    const wrongAad = new TextEncoder().encode("wrong-header");
    await expect(decrypt(backend, key, ciphertext, iv, wrongAad)).rejects.toThrow();
  });

  it("tampered ciphertext throws", async () => {
    const backend = getBackend();
    const key = backend.randomBytes(32);
    const { ciphertext, iv } = await encrypt(backend, key, new TextEncoder().encode("tamper test"));

    const tampered = new Uint8Array(ciphertext);
    tampered[0] ^= 0xff;
    await expect(decrypt(backend, key, tampered, iv)).rejects.toThrow();
  });

  it("encodeHeaderAsAad produces consistent output", () => {
    const aad1 = encodeHeaderAsAad("test-key", 5, 3);
    const aad2 = encodeHeaderAsAad("test-key", 5, 3);
    expect(bytesEqual(aad1, aad2)).toBe(true);
  });

  it("different messages produce different IVs", async () => {
    const backend = getBackend();
    const key = backend.randomBytes(32);
    const plaintext = new TextEncoder().encode("same");

    const r1 = await encrypt(backend, key, plaintext);
    const r2 = await encrypt(backend, key, plaintext);
    expect(bytesEqual(r1.iv, r2.iv)).toBe(false);
  });

  it("unicode roundtrips correctly", async () => {
    const backend = getBackend();
    const key = backend.randomBytes(32);
    const text = "Héllo wörld €100";

    const { ciphertext, iv } = await encrypt(backend, key, new TextEncoder().encode(text));
    const decrypted = await decrypt(backend, key, ciphertext, iv);
    expect(new TextDecoder().decode(decrypted)).toBe(text);
  });
});

// ── Double Ratchet ──

describe("Double Ratchet", () => {
  async function setupSession() {
    const backend = getBackend();
    const alice = generateIdentityKeyPair(backend);
    const bob = generateIdentityKeyPair(backend);
    const spk = generateSignedPreKey(backend, bob.signing.privateKey, 1);
    const [opk] = generateOneTimePreKeys(backend, 1, 1);

    const bundle: PreKeyBundle = {
      identityKey: bob.dh.publicKey,
      signingKey: bob.signing.publicKey,
      signedPreKeyPublic: spk.keyPair.publicKey,
      signedPreKeyId: spk.keyId,
      signedPreKeySignature: spk.signature,
      oneTimePreKeyPublic: opk.keyPair.publicKey,
      oneTimePreKeyId: opk.keyId,
    };

    const aliceX3DH = await x3dhInitiate(backend, alice, bundle);
    const bobSharedSecret = await x3dhRespond(
      backend,
      bob,
      spk.keyPair.privateKey,
      opk.keyPair.privateKey,
      alice.dh.publicKey,
      aliceX3DH.ephemeralPublicKey,
    );

    const aliceState = await initializeSender(
      backend,
      aliceX3DH.sharedSecret,
      spk.keyPair.publicKey,
    );
    const bobState = initializeReceiver(bobSharedSecret, spk.keyPair);

    return { backend, aliceState, bobState };
  }

  it("basic encrypt → decrypt roundtrip", async () => {
    const { backend, aliceState, bobState } = await setupSession();

    const { state: aliceAfter, encrypted } = await ratchetEncrypt(
      backend,
      aliceState,
      "Hello Bob!",
    );
    const { plaintext } = await ratchetDecrypt(backend, bobState, encrypted);

    expect(plaintext).toBe("Hello Bob!");
    expect(aliceAfter).toBeDefined();
  });

  it("back-and-forth messaging", async () => {
    const { backend, aliceState: alice, bobState: bob } = await setupSession();

    // Alice → Bob
    const { state: a1, encrypted: e1 } = await ratchetEncrypt(backend, alice, "msg 1");
    const { state: b1, plaintext: p1 } = await ratchetDecrypt(backend, bob, e1);
    expect(p1).toBe("msg 1");

    // Bob → Alice (DH ratchet step)
    const { state: b2, encrypted: e2 } = await ratchetEncrypt(backend, b1, "reply 1");
    const { state: a2, plaintext: p2 } = await ratchetDecrypt(backend, a1, e2);
    expect(p2).toBe("reply 1");

    // Alice → Bob again
    const { encrypted: e3 } = await ratchetEncrypt(backend, a2, "msg 2");
    const { plaintext: p3 } = await ratchetDecrypt(backend, b2, e3);
    expect(p3).toBe("msg 2");
  });

  it("multiple messages in same direction (symmetric chain)", async () => {
    const { backend, aliceState, bobState } = await setupSession();

    const { state: a1, encrypted: e1 } = await ratchetEncrypt(backend, aliceState, "first");
    const { state: a2, encrypted: e2 } = await ratchetEncrypt(backend, a1, "second");
    const { encrypted: e3 } = await ratchetEncrypt(backend, a2, "third");

    const { state: b1, plaintext: p1 } = await ratchetDecrypt(backend, bobState, e1);
    const { state: b2, plaintext: p2 } = await ratchetDecrypt(backend, b1, e2);
    const { plaintext: p3 } = await ratchetDecrypt(backend, b2, e3);

    expect(p1).toBe("first");
    expect(p2).toBe("second");
    expect(p3).toBe("third");
  });

  it("out-of-order messages are handled via skipped keys", async () => {
    const { backend, aliceState, bobState } = await setupSession();

    const { state: a1, encrypted: e1 } = await ratchetEncrypt(backend, aliceState, "first");
    const { encrypted: e2 } = await ratchetEncrypt(backend, a1, "second");

    // Decrypt second first (out of order)
    const { state: b1, plaintext: p2 } = await ratchetDecrypt(backend, bobState, e2);
    expect(p2).toBe("second");

    // Now decrypt the skipped first message
    const { plaintext: p1 } = await ratchetDecrypt(backend, b1, e1);
    expect(p1).toBe("first");
  });

  it("each message uses a different encryption key", async () => {
    const { backend, aliceState } = await setupSession();

    const { state: a1, encrypted: e1 } = await ratchetEncrypt(backend, aliceState, "same text");
    const { encrypted: e2 } = await ratchetEncrypt(backend, a1, "same text");

    expect(e1.ciphertext).not.toBe(e2.ciphertext);
  });

  it("serialization roundtrip preserves state", async () => {
    const { backend, aliceState } = await setupSession();

    const { state: afterEncrypt, encrypted } = await ratchetEncrypt(
      backend,
      aliceState,
      "serialize test",
    );

    const serialized = serializeRatchetState(afterEncrypt);
    const deserialized = deserializeRatchetState(serialized);

    const { encrypted: e2 } = await ratchetEncrypt(backend, deserialized, "after deserialize");
    expect(e2.ciphertext).toBeDefined();
    expect(e2.header.messageNumber).toBe(encrypted.header.messageNumber + 1);
  });

  it("wrong session → decryption fails", async () => {
    const { backend, aliceState } = await setupSession();
    const session2 = await setupSession();

    const { encrypted } = await ratchetEncrypt(backend, aliceState, "wrong session");
    await expect(ratchetDecrypt(backend, session2.bobState, encrypted)).rejects.toThrow();
  });

  it("empty string roundtrips correctly", async () => {
    const { backend, aliceState, bobState } = await setupSession();

    const { encrypted } = await ratchetEncrypt(backend, aliceState, "");
    const { plaintext } = await ratchetDecrypt(backend, bobState, encrypted);
    expect(plaintext).toBe("");
  });

  it("large message (50KB) roundtrips correctly", async () => {
    const { backend, aliceState, bobState } = await setupSession();
    const large = "x".repeat(50_000);

    const { encrypted } = await ratchetEncrypt(backend, aliceState, large);
    const { plaintext } = await ratchetDecrypt(backend, bobState, encrypted);
    expect(plaintext).toBe(large);
  });
});

// ── Safety Numbers ──

describe("safety numbers", () => {
  it("generates a 60-digit code (12 groups of 5)", async () => {
    const backend = getBackend();
    const alice = generateIdentityKeyPair(backend);
    const bob = generateIdentityKeyPair(backend);

    const code = await generateSafetyNumber(
      "alice-id",
      alice.signing.publicKey,
      "bob-id",
      bob.signing.publicKey,
    );

    const groups = code.split(" ");
    expect(groups).toHaveLength(12);
    for (const group of groups) {
      expect(group).toMatch(/^\d{5}$/);
    }
  });

  it("is symmetric: same code regardless of who computes it", async () => {
    const backend = getBackend();
    const alice = generateIdentityKeyPair(backend);
    const bob = generateIdentityKeyPair(backend);

    const codeAlice = await generateSafetyNumber(
      "alice-id",
      alice.signing.publicKey,
      "bob-id",
      bob.signing.publicKey,
    );
    const codeBob = await generateSafetyNumber(
      "bob-id",
      bob.signing.publicKey,
      "alice-id",
      alice.signing.publicKey,
    );

    expect(codeAlice).toBe(codeBob);
  });

  it("is deterministic: same inputs → same output", async () => {
    const backend = getBackend();
    const alice = generateIdentityKeyPair(backend);
    const bob = generateIdentityKeyPair(backend);

    const code1 = await generateSafetyNumber(
      "alice-id",
      alice.signing.publicKey,
      "bob-id",
      bob.signing.publicKey,
    );
    const code2 = await generateSafetyNumber(
      "alice-id",
      alice.signing.publicKey,
      "bob-id",
      bob.signing.publicKey,
    );

    expect(code1).toBe(code2);
  });

  it("different keys produce different safety numbers", async () => {
    const backend = getBackend();
    const alice = generateIdentityKeyPair(backend);
    const bob = generateIdentityKeyPair(backend);
    const eve = generateIdentityKeyPair(backend);

    const codeAB = await generateSafetyNumber(
      "alice-id",
      alice.signing.publicKey,
      "bob-id",
      bob.signing.publicKey,
    );
    const codeAE = await generateSafetyNumber(
      "alice-id",
      alice.signing.publicKey,
      "eve-id",
      eve.signing.publicKey,
    );

    expect(codeAB).not.toBe(codeAE);
  });
});

// ── Identity Backup ──

describe("identity backup (PIN-encrypted)", () => {
  it("encrypt → decrypt roundtrip", async () => {
    const backend = getBackend();
    const identity = generateIdentityKeyPair(backend);

    const data = {
      signingPrivateKey: toBase64(identity.signing.privateKey),
      signingPublicKey: toBase64(identity.signing.publicKey),
      dhPrivateKey: toBase64(identity.dh.privateKey),
      dhPublicKey: toBase64(identity.dh.publicKey),
    };

    const backup = await encryptIdentityBackup(backend, data, "123456");
    const recovered = await decryptIdentityBackup(backend, backup, "123456");
    expect(recovered).toEqual(data);
  });

  it("wrong PIN → decryption throws", async () => {
    const backend = getBackend();
    const identity = generateIdentityKeyPair(backend);

    const data = {
      signingPrivateKey: toBase64(identity.signing.privateKey),
      signingPublicKey: toBase64(identity.signing.publicKey),
      dhPrivateKey: toBase64(identity.dh.privateKey),
      dhPublicKey: toBase64(identity.dh.publicKey),
    };

    const backup = await encryptIdentityBackup(backend, data, "123456");
    await expect(decryptIdentityBackup(backend, backup, "654321")).rejects.toThrow();
  });

  it("two backups of same data → different ciphertext (random salt/IV)", async () => {
    const backend = getBackend();
    const identity = generateIdentityKeyPair(backend);

    const data = {
      signingPrivateKey: toBase64(identity.signing.privateKey),
      signingPublicKey: toBase64(identity.signing.publicKey),
      dhPrivateKey: toBase64(identity.dh.privateKey),
      dhPublicKey: toBase64(identity.dh.publicKey),
    };

    const backup1 = await encryptIdentityBackup(backend, data, "123456");
    const backup2 = await encryptIdentityBackup(backend, data, "123456");

    expect(backup1.ciphertext).not.toBe(backup2.ciphertext);
    expect(backup1.salt).not.toBe(backup2.salt);
  });

  it("tampered ciphertext → throws", async () => {
    const backend = getBackend();
    const identity = generateIdentityKeyPair(backend);

    const data = {
      signingPrivateKey: toBase64(identity.signing.privateKey),
      signingPublicKey: toBase64(identity.signing.publicKey),
      dhPrivateKey: toBase64(identity.dh.privateKey),
      dhPublicKey: toBase64(identity.dh.publicKey),
    };

    const backup = await encryptIdentityBackup(backend, data, "123456");
    const bytes = fromBase64(backup.ciphertext);
    bytes[0] ^= 0xff;
    const tampered = { ...backup, ciphertext: toBase64(bytes) };

    await expect(decryptIdentityBackup(backend, tampered, "123456")).rejects.toThrow();
  });

  it("deriveKeyFromPIN is deterministic with same salt", async () => {
    const backend = getBackend();
    const salt = backend.randomBytes(32);
    const key1 = await deriveKeyFromPIN(backend, "123456", salt, 1000);
    const key2 = await deriveKeyFromPIN(backend, "123456", salt, 1000);
    expect(bytesEqual(key1, key2)).toBe(true);
  });

  it("deriveKeyFromPIN: different PINs → different keys", async () => {
    const backend = getBackend();
    const salt = backend.randomBytes(32);
    const key1 = await deriveKeyFromPIN(backend, "123456", salt, 1000);
    const key2 = await deriveKeyFromPIN(backend, "654321", salt, 1000);
    expect(bytesEqual(key1, key2)).toBe(false);
  });
});
