import { beforeAll, describe, expect, it } from "vitest";

import {
  decrypt1to1,
  decryptGroupMessage,
  encrypt1to1,
  encryptGroupMessage,
  establishSession,
  generateEd25519KeyPair,
  generatePreKeys,
  generateRegistrationId,
  generateSignedPreKey,
  generateX25519KeyPair,
  initAndDistributeSenderKey,
  isPreKeyWhisperMessage,
  processDistribution,
  setCryptoProvider,
  toBase64,
} from "../index";
import type {
  KeyPair,
  PreKeyBundle,
  PreKeyRecord,
  ProtocolAddress,
  SenderKeyRecord,
  SessionRecord,
  SignedPreKeyRecord,
  SignalProtocolStore,
} from "../index";
import { createWebCryptoProvider } from "../primitives/WebCryptoProvider";

/** In-memory Signal Protocol store for testing. */
class InMemoryStore implements SignalProtocolStore {
  private dhKeyPair!: KeyPair;
  private signingKeyPair!: KeyPair;
  private regId!: number;
  private identities = new Map<string, Uint8Array>();
  private preKeys = new Map<number, PreKeyRecord>();
  private signedPreKeys = new Map<number, SignedPreKeyRecord>();
  private sessions = new Map<string, SessionRecord>();
  private senderKeys = new Map<string, SenderKeyRecord>();

  async getIdentityKeyPair(): Promise<KeyPair> {
    return this.dhKeyPair;
  }
  async getSigningKeyPair(): Promise<KeyPair> {
    return this.signingKeyPair;
  }
  async getLocalRegistrationId(): Promise<number> {
    return this.regId;
  }
  async setIdentityKeyPair(dh: KeyPair, signing: KeyPair): Promise<void> {
    this.dhKeyPair = dh;
    this.signingKeyPair = signing;
  }
  async setLocalRegistrationId(id: number): Promise<void> {
    this.regId = id;
  }
  async saveIdentity(_addr: ProtocolAddress, key: Uint8Array): Promise<boolean> {
    const k = `${_addr.userId}:${_addr.deviceId}`;
    const existing = this.identities.get(k);
    this.identities.set(k, key);
    return !!existing && toBase64(existing) !== toBase64(key);
  }
  async isTrustedIdentity(_addr: ProtocolAddress, _key: Uint8Array): Promise<boolean> {
    void _addr;
    void _key;
    return true;
  }
  async getIdentity(addr: ProtocolAddress): Promise<Uint8Array | null> {
    return this.identities.get(`${addr.userId}:${addr.deviceId}`) ?? null;
  }
  async loadPreKey(id: number): Promise<PreKeyRecord> {
    const pk = this.preKeys.get(id);
    if (!pk) throw new Error(`PreKey ${id} not found`);
    return pk;
  }
  async storePreKey(id: number, record: PreKeyRecord): Promise<void> {
    this.preKeys.set(id, record);
  }
  async removePreKey(id: number): Promise<void> {
    this.preKeys.delete(id);
  }
  async getAvailablePreKeyCount(): Promise<number> {
    return this.preKeys.size;
  }
  async loadSignedPreKey(id: number): Promise<SignedPreKeyRecord> {
    const spk = this.signedPreKeys.get(id);
    if (!spk) throw new Error(`SignedPreKey ${id} not found`);
    return spk;
  }
  async storeSignedPreKey(id: number, record: SignedPreKeyRecord): Promise<void> {
    this.signedPreKeys.set(id, record);
  }
  async loadSession(addr: ProtocolAddress): Promise<SessionRecord | null> {
    return this.sessions.get(`${addr.userId}:${addr.deviceId}`) ?? null;
  }
  async storeSession(addr: ProtocolAddress, record: SessionRecord): Promise<void> {
    this.sessions.set(`${addr.userId}:${addr.deviceId}`, record);
  }
  async getSubDeviceSessions(_userId: string): Promise<number[]> {
    void _userId;
    return [];
  }
  async storeSenderKey(
    sender: ProtocolAddress,
    distId: string,
    record: SenderKeyRecord,
  ): Promise<void> {
    this.senderKeys.set(`${sender.userId}:${sender.deviceId}:${distId}`, record);
  }
  async loadSenderKey(sender: ProtocolAddress, distId: string): Promise<SenderKeyRecord | null> {
    return this.senderKeys.get(`${sender.userId}:${sender.deviceId}:${distId}`) ?? null;
  }
}

function setupAliceAndBob() {
  const aliceStore = new InMemoryStore();
  const bobStore = new InMemoryStore();

  const aliceDh = generateX25519KeyPair();
  const aliceSigning = generateEd25519KeyPair();
  const aliceRegId = generateRegistrationId();

  const bobDh = generateX25519KeyPair();
  const bobSigning = generateEd25519KeyPair();
  const bobRegId = generateRegistrationId();

  aliceStore.setIdentityKeyPair(aliceDh, aliceSigning);
  aliceStore.setLocalRegistrationId(aliceRegId);
  bobStore.setIdentityKeyPair(bobDh, bobSigning);
  bobStore.setLocalRegistrationId(bobRegId);

  // Generate Bob's pre-keys
  const bobSignedPreKey = generateSignedPreKey(bobSigning.privateKey, 1);
  bobStore.storeSignedPreKey(1, bobSignedPreKey);
  const bobPreKeys = generatePreKeys(1, 5);
  for (const pk of bobPreKeys) {
    bobStore.storePreKey(pk.keyId, pk);
  }

  const bobBundle: PreKeyBundle = {
    registrationId: bobRegId,
    deviceId: "bob-device-1",
    identityKey: bobDh.publicKey,
    signingKey: bobSigning.publicKey,
    signedPreKeyId: bobSignedPreKey.keyId,
    signedPreKey: bobSignedPreKey.keyPair.publicKey,
    signedPreKeySignature: bobSignedPreKey.signature,
    oneTimePreKeyId: bobPreKeys[0].keyId,
    oneTimePreKey: bobPreKeys[0].keyPair.publicKey,
  };

  const aliceAddress: ProtocolAddress = { userId: "alice", deviceId: "alice-device-1" };
  const bobAddress: ProtocolAddress = { userId: "bob", deviceId: "bob-device-1" };

  return {
    aliceStore,
    bobStore,
    aliceAddress,
    bobAddress,
    bobBundle,
    aliceRegId,
    bobRegId,
    aliceDh,
    bobDh,
    aliceSigning,
    bobSigning,
  };
}

beforeAll(() => {
  setCryptoProvider(createWebCryptoProvider());
});

describe("E2E session establishment and messaging", () => {
  it("Alice -> Bob: first message is a PreKeyWhisperMessage", async () => {
    const { aliceStore, bobStore, aliceAddress, bobAddress, bobBundle } = setupAliceAndBob();

    // Alice establishes session with Bob's bundle
    await establishSession(aliceStore, bobAddress, bobBundle);

    // Verify the session has pendingPreKey
    const session = await aliceStore.loadSession(bobAddress);
    expect(session).not.toBeNull();
    expect(session!.pendingPreKey).toBeDefined();
    expect(session!.pendingPreKey!.signedPreKeyId).toBe(bobBundle.signedPreKeyId);

    // Alice encrypts a message
    const plaintext = new TextEncoder().encode("Hello Bob!");
    const encrypted = await encrypt1to1(aliceStore, bobAddress, plaintext);

    // Verify it's a PreKeyWhisperMessage (high bit set)
    expect(isPreKeyWhisperMessage(encrypted)).toBe(true);

    // Verify pendingPreKey is cleared after encryption
    const sessionAfter = await aliceStore.loadSession(bobAddress);
    expect(sessionAfter!.pendingPreKey).toBeUndefined();

    // Bob decrypts
    const decrypted = await decrypt1to1(bobStore, aliceAddress, encrypted);
    expect(new TextDecoder().decode(decrypted)).toBe("Hello Bob!");
  });

  it("Bob -> Alice: reply is a regular WhisperMessage", async () => {
    const { aliceStore, bobStore, aliceAddress, bobAddress, bobBundle } = setupAliceAndBob();

    // Alice establishes and sends first message
    await establishSession(aliceStore, bobAddress, bobBundle);
    const msg1 = await encrypt1to1(aliceStore, bobAddress, new TextEncoder().encode("Hello Bob!"));
    await decrypt1to1(bobStore, aliceAddress, msg1);

    // Bob replies — should be a regular WhisperMessage
    const reply = await encrypt1to1(bobStore, aliceAddress, new TextEncoder().encode("Hey Alice!"));
    expect(isPreKeyWhisperMessage(reply)).toBe(false);

    // Alice decrypts Bob's reply
    const decrypted = await decrypt1to1(aliceStore, bobAddress, reply);
    expect(new TextDecoder().decode(decrypted)).toBe("Hey Alice!");
  });

  it("Multiple messages back and forth", async () => {
    const { aliceStore, bobStore, aliceAddress, bobAddress, bobBundle } = setupAliceAndBob();

    await establishSession(aliceStore, bobAddress, bobBundle);

    // Alice sends message 1
    const enc1 = await encrypt1to1(aliceStore, bobAddress, new TextEncoder().encode("Message 1"));
    expect(isPreKeyWhisperMessage(enc1)).toBe(true);
    const dec1 = await decrypt1to1(bobStore, aliceAddress, enc1);
    expect(new TextDecoder().decode(dec1)).toBe("Message 1");

    // Alice sends message 2 (should NOT be PreKeyWhisperMessage now)
    const enc2 = await encrypt1to1(aliceStore, bobAddress, new TextEncoder().encode("Message 2"));
    expect(isPreKeyWhisperMessage(enc2)).toBe(false);
    const dec2 = await decrypt1to1(bobStore, aliceAddress, enc2);
    expect(new TextDecoder().decode(dec2)).toBe("Message 2");

    // Bob replies
    const enc3 = await encrypt1to1(bobStore, aliceAddress, new TextEncoder().encode("Reply 1"));
    const dec3 = await decrypt1to1(aliceStore, bobAddress, enc3);
    expect(new TextDecoder().decode(dec3)).toBe("Reply 1");

    // Another round
    const enc4 = await encrypt1to1(aliceStore, bobAddress, new TextEncoder().encode("Message 3"));
    const dec4 = await decrypt1to1(bobStore, aliceAddress, enc4);
    expect(new TextDecoder().decode(dec4)).toBe("Message 3");
  });

  it("Sender key distribution via 1:1 session + group encryption", async () => {
    const { aliceStore, bobStore, aliceAddress, bobAddress, bobBundle } = setupAliceAndBob();

    const conversationId = "conv-123";

    // Alice establishes session with Bob
    await establishSession(aliceStore, bobAddress, bobBundle);

    // Alice creates and distributes sender key
    const { distributions } = await initAndDistributeSenderKey(
      aliceStore,
      aliceAddress,
      conversationId,
      [bobAddress],
    );

    expect(distributions).toHaveLength(1);
    expect(distributions[0].recipientAddress).toEqual(bobAddress);

    // The distribution should be a PreKeyWhisperMessage (first 1:1 message)
    expect(isPreKeyWhisperMessage(distributions[0].encryptedDistribution)).toBe(true);

    // Bob decrypts the 1:1 message to get the distribution bytes
    const distributionBytes = await decrypt1to1(
      bobStore,
      aliceAddress,
      distributions[0].encryptedDistribution,
    );

    // Bob processes the distribution
    await processDistribution(bobStore, aliceAddress, distributionBytes);

    // Alice encrypts a group message
    const groupMsg = await encryptGroupMessage(
      aliceStore,
      aliceAddress,
      conversationId,
      new TextEncoder().encode("Hello group!"),
    );

    // Bob decrypts the group message
    const decrypted = await decryptGroupMessage(bobStore, aliceAddress, conversationId, groupMsg);
    expect(new TextDecoder().decode(decrypted)).toBe("Hello group!");
  });
});
