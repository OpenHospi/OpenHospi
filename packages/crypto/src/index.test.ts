import { describe, expect, it } from "vitest";

import {
  createBackup,
  decryptBackup,
  decryptFromGroup,
  encryptForGroup,
  exportPrivateKey,
  exportPublicKey,
  fromBase64,
  generateKeyPair,
  importPrivateKey,
  importPublicKey,
  toBase64,
} from "./index";

// ── Helpers ──

async function makeUser(id: string) {
  const kp = await generateKeyPair();
  const pubJwk = await exportPublicKey(kp.publicKey);
  const pub = await importPublicKey(pubJwk);
  return { id, keyPair: kp, publicKey: pub, publicJwk: pubJwk };
}

// ── Key Generation & Serialization ──

describe("key generation & serialization", () => {
  it("generateKeyPair returns valid P-256 CryptoKeyPair", async () => {
    const kp = await generateKeyPair();
    expect(kp.publicKey).toBeInstanceOf(CryptoKey);
    expect(kp.privateKey).toBeInstanceOf(CryptoKey);
    expect(kp.publicKey.algorithm).toMatchObject({ name: "ECDH", namedCurve: "P-256" });
  });

  it("public key export → import roundtrip preserves key", async () => {
    const kp = await generateKeyPair();
    const jwk = await exportPublicKey(kp.publicKey);
    const imported = await importPublicKey(jwk);

    // Verify by re-exporting and comparing JWK
    const reExported = await exportPublicKey(imported);
    expect(reExported.x).toBe(jwk.x);
    expect(reExported.y).toBe(jwk.y);
  });

  it("private key export → import roundtrip preserves key", async () => {
    const kp = await generateKeyPair();
    const jwk = await exportPrivateKey(kp.privateKey);
    const imported = await importPrivateKey(jwk);

    const reExported = await exportPrivateKey(imported);
    expect(reExported.d).toBe(jwk.d);
    expect(reExported.x).toBe(jwk.x);
    expect(reExported.y).toBe(jwk.y);
  });

  it("exported JWK has correct P-256 fields", async () => {
    const kp = await generateKeyPair();
    const pubJwk = await exportPublicKey(kp.publicKey);
    const privJwk = await exportPrivateKey(kp.privateKey);

    expect(pubJwk.kty).toBe("EC");
    expect(pubJwk.crv).toBe("P-256");
    expect(pubJwk.x).toBeDefined();
    expect(pubJwk.y).toBeDefined();
    expect(pubJwk.d).toBeUndefined();

    expect(privJwk.kty).toBe("EC");
    expect(privJwk.crv).toBe("P-256");
    expect(privJwk.d).toBeDefined();
  });
});

// ── ECDH Shared Secret ──

describe("ECDH shared secret", () => {
  it("shared key is symmetric: encrypt with Alice's, decrypt with Bob's", async () => {
    const alice = await makeUser("alice");
    const bob = await makeUser("bob");

    const msg = await encryptForGroup("symmetric test", alice.keyPair.privateKey, [
      { userId: "bob", publicKey: bob.publicKey },
    ]);

    const decrypted = await decryptFromGroup(
      msg.ciphertext, msg.iv, msg.encryptedKeys,
      "bob", bob.keyPair.privateKey, alice.publicKey,
    );
    expect(decrypted).toBe("symmetric test");
  });

  it("different key pairs produce different encrypted output", async () => {
    const alice = await makeUser("alice");
    const bob = await makeUser("bob");
    const charlie = await makeUser("charlie");

    const msg1 = await encryptForGroup("hello", alice.keyPair.privateKey, [
      { userId: "bob", publicKey: bob.publicKey },
    ]);
    const msg2 = await encryptForGroup("hello", alice.keyPair.privateKey, [
      { userId: "charlie", publicKey: charlie.publicKey },
    ]);

    // Different recipients → different wrapped keys
    expect(msg1.encryptedKeys[0].wrappedKey).not.toBe(msg2.encryptedKeys[0].wrappedKey);
  });
});

// ── encryptForGroup / decryptFromGroup ──

describe("encryptForGroup / decryptFromGroup", () => {
  it("single recipient encrypt → decrypt roundtrip", async () => {
    const alice = await makeUser("alice");
    const bob = await makeUser("bob");

    const msg = await encryptForGroup("hello bob", alice.keyPair.privateKey, [
      { userId: "bob", publicKey: bob.publicKey },
    ]);

    const decrypted = await decryptFromGroup(
      msg.ciphertext, msg.iv, msg.encryptedKeys,
      "bob", bob.keyPair.privateKey, alice.publicKey,
    );
    expect(decrypted).toBe("hello bob");
  });

  it("multi-recipient: each decrypts same plaintext independently", async () => {
    const sender = await makeUser("sender");
    const r1 = await makeUser("r1");
    const r2 = await makeUser("r2");
    const r3 = await makeUser("r3");

    const msg = await encryptForGroup("group message", sender.keyPair.privateKey, [
      { userId: "r1", publicKey: r1.publicKey },
      { userId: "r2", publicKey: r2.publicKey },
      { userId: "r3", publicKey: r3.publicKey },
    ]);

    expect(msg.encryptedKeys).toHaveLength(3);

    for (const r of [r1, r2, r3]) {
      const decrypted = await decryptFromGroup(
        msg.ciphertext, msg.iv, msg.encryptedKeys,
        r.id, r.keyPair.privateKey, sender.publicKey,
      );
      expect(decrypted).toBe("group message");
    }
  });

  it("non-recipient gets 'No encrypted key found' error", async () => {
    const alice = await makeUser("alice");
    const bob = await makeUser("bob");
    const eve = await makeUser("eve");

    const msg = await encryptForGroup("secret", alice.keyPair.privateKey, [
      { userId: "bob", publicKey: bob.publicKey },
    ]);

    await expect(
      decryptFromGroup(msg.ciphertext, msg.iv, msg.encryptedKeys, "eve", eve.keyPair.privateKey, alice.publicKey),
    ).rejects.toThrow("No encrypted key found for this user");
  });

  it("wrong sender public key → decryption throws (GCM auth failure)", async () => {
    const alice = await makeUser("alice");
    const bob = await makeUser("bob");
    const eve = await makeUser("eve");

    const msg = await encryptForGroup("secret", alice.keyPair.privateKey, [
      { userId: "bob", publicKey: bob.publicKey },
    ]);

    // Use eve's public key instead of alice's → wrong shared secret → GCM tag mismatch
    await expect(
      decryptFromGroup(msg.ciphertext, msg.iv, msg.encryptedKeys, "bob", bob.keyPair.privateKey, eve.publicKey),
    ).rejects.toThrow();
  });

  it("empty string roundtrips correctly", async () => {
    const alice = await makeUser("alice");
    const bob = await makeUser("bob");

    const msg = await encryptForGroup("", alice.keyPair.privateKey, [
      { userId: "bob", publicKey: bob.publicKey },
    ]);

    const decrypted = await decryptFromGroup(
      msg.ciphertext, msg.iv, msg.encryptedKeys,
      "bob", bob.keyPair.privateKey, alice.publicKey,
    );
    expect(decrypted).toBe("");
  });

  it("unicode/emoji roundtrips correctly", async () => {
    const alice = await makeUser("alice");
    const bob = await makeUser("bob");
    const text = "Héllo 🏠 wörld €100";

    const msg = await encryptForGroup(text, alice.keyPair.privateKey, [
      { userId: "bob", publicKey: bob.publicKey },
    ]);

    const decrypted = await decryptFromGroup(
      msg.ciphertext, msg.iv, msg.encryptedKeys,
      "bob", bob.keyPair.privateKey, alice.publicKey,
    );
    expect(decrypted).toBe(text);
  });

  it("large message (50KB) roundtrips correctly", async () => {
    const alice = await makeUser("alice");
    const bob = await makeUser("bob");
    const large = "x".repeat(50_000);

    const msg = await encryptForGroup(large, alice.keyPair.privateKey, [
      { userId: "bob", publicKey: bob.publicKey },
    ]);

    const decrypted = await decryptFromGroup(
      msg.ciphertext, msg.iv, msg.encryptedKeys,
      "bob", bob.keyPair.privateKey, alice.publicKey,
    );
    expect(decrypted).toBe(large);
  });
});

// ── Tamper Resistance — AES-GCM Authentication ──

describe("tamper resistance (AES-GCM authentication)", () => {
  it("modified ciphertext → throws", async () => {
    const alice = await makeUser("alice");
    const bob = await makeUser("bob");

    const msg = await encryptForGroup("tamper test", alice.keyPair.privateKey, [
      { userId: "bob", publicKey: bob.publicKey },
    ]);

    // Flip a byte in the ciphertext
    const bytes = fromBase64(msg.ciphertext);
    bytes[0] ^= 0xff;
    const tampered = toBase64(bytes);

    await expect(
      decryptFromGroup(tampered, msg.iv, msg.encryptedKeys, "bob", bob.keyPair.privateKey, alice.publicKey),
    ).rejects.toThrow();
  });

  it("modified IV → throws", async () => {
    const alice = await makeUser("alice");
    const bob = await makeUser("bob");

    const msg = await encryptForGroup("tamper test", alice.keyPair.privateKey, [
      { userId: "bob", publicKey: bob.publicKey },
    ]);

    const bytes = fromBase64(msg.iv);
    bytes[0] ^= 0xff;
    const tamperedIv = toBase64(bytes);

    await expect(
      decryptFromGroup(msg.ciphertext, tamperedIv, msg.encryptedKeys, "bob", bob.keyPair.privateKey, alice.publicKey),
    ).rejects.toThrow();
  });

  it("modified wrapped key → throws", async () => {
    const alice = await makeUser("alice");
    const bob = await makeUser("bob");

    const msg = await encryptForGroup("tamper test", alice.keyPair.privateKey, [
      { userId: "bob", publicKey: bob.publicKey },
    ]);

    const bytes = fromBase64(msg.encryptedKeys[0].wrappedKey);
    bytes[bytes.length - 1] ^= 0xff;
    const tamperedKeys = [{ userId: "bob", wrappedKey: toBase64(bytes) }];

    await expect(
      decryptFromGroup(msg.ciphertext, msg.iv, tamperedKeys, "bob", bob.keyPair.privateKey, alice.publicKey),
    ).rejects.toThrow();
  });

  it("truncated ciphertext → throws", async () => {
    const alice = await makeUser("alice");
    const bob = await makeUser("bob");

    const msg = await encryptForGroup("tamper test", alice.keyPair.privateKey, [
      { userId: "bob", publicKey: bob.publicKey },
    ]);

    const bytes = fromBase64(msg.ciphertext);
    const truncated = toBase64(bytes.slice(0, Math.floor(bytes.length / 2)));

    await expect(
      decryptFromGroup(truncated, msg.iv, msg.encryptedKeys, "bob", bob.keyPair.privateKey, alice.publicKey),
    ).rejects.toThrow();
  });
});

// ── Non-Determinism & Key Isolation ──

describe("non-determinism & key isolation", () => {
  it("same plaintext encrypted twice → different IVs", async () => {
    const alice = await makeUser("alice");
    const bob = await makeUser("bob");

    const msg1 = await encryptForGroup("same", alice.keyPair.privateKey, [
      { userId: "bob", publicKey: bob.publicKey },
    ]);
    const msg2 = await encryptForGroup("same", alice.keyPair.privateKey, [
      { userId: "bob", publicKey: bob.publicKey },
    ]);

    expect(msg1.iv).not.toBe(msg2.iv);
  });

  it("same plaintext encrypted twice → different ciphertext", async () => {
    const alice = await makeUser("alice");
    const bob = await makeUser("bob");

    const msg1 = await encryptForGroup("same", alice.keyPair.privateKey, [
      { userId: "bob", publicKey: bob.publicKey },
    ]);
    const msg2 = await encryptForGroup("same", alice.keyPair.privateKey, [
      { userId: "bob", publicKey: bob.publicKey },
    ]);

    expect(msg1.ciphertext).not.toBe(msg2.ciphertext);
  });

  it("different messages → different wrapped keys (per-message AES key isolation)", async () => {
    const alice = await makeUser("alice");
    const bob = await makeUser("bob");

    const msg1 = await encryptForGroup("message one", alice.keyPair.privateKey, [
      { userId: "bob", publicKey: bob.publicKey },
    ]);
    const msg2 = await encryptForGroup("message two", alice.keyPair.privateKey, [
      { userId: "bob", publicKey: bob.publicKey },
    ]);

    expect(msg1.encryptedKeys[0].wrappedKey).not.toBe(msg2.encryptedKeys[0].wrappedKey);
  });
});

// ── Base64 Helpers ──

describe("base64 helpers", () => {
  it("toBase64(fromBase64(str)) roundtrips for known values", () => {
    const original = "SGVsbG8gV29ybGQ="; // "Hello World"
    expect(toBase64(fromBase64(original))).toBe(original);

    const another = "AQIDBAU="; // [1,2,3,4,5]
    expect(toBase64(fromBase64(another))).toBe(another);
  });

  it("handles empty buffer and large buffers", () => {
    // Empty
    const empty = new Uint8Array(0);
    expect(toBase64(empty)).toBe("");
    expect(fromBase64("")).toEqual(new Uint8Array(0));

    // Large (1KB)
    const large = new Uint8Array(1024);
    for (let i = 0; i < 1024; i++) large[i] = i % 256;
    const encoded = toBase64(large);
    const decoded = fromBase64(encoded);
    expect(decoded).toEqual(large);
  });
});

// ── Backup Encrypt / Decrypt ──

describe("backup encrypt / decrypt", () => {
  it("createBackup → decryptBackup roundtrip: recovered JWK matches original", async () => {
    const kp = await generateKeyPair();
    const privJwk = await exportPrivateKey(kp.privateKey);

    const backup = await createBackup(privJwk);
    const recovered = await decryptBackup(backup);

    expect(recovered).toEqual(privJwk);
  });

  it("tampered encrypted data → decryptBackup throws", async () => {
    const kp = await generateKeyPair();
    const privJwk = await exportPrivateKey(kp.privateKey);
    const backup = await createBackup(privJwk);

    // Flip a byte in the encrypted data
    const bytes = fromBase64(backup.encryptedPrivateKey);
    bytes[0] ^= 0xff;
    const tampered = { ...backup, encryptedPrivateKey: toBase64(bytes) };

    await expect(decryptBackup(tampered)).rejects.toThrow();
  });

  it("two backups of same key → different ciphertext (random AES key per backup)", async () => {
    const kp = await generateKeyPair();
    const privJwk = await exportPrivateKey(kp.privateKey);

    const backup1 = await createBackup(privJwk);
    const backup2 = await createBackup(privJwk);

    expect(backup1.encryptedPrivateKey).not.toBe(backup2.encryptedPrivateKey);
    expect(backup1.backupKey).not.toBe(backup2.backupKey);
  });
});
