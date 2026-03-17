# Signal Protocol E2E Encryption for Group Chats

## Complete Architecture & Implementation Guide

### Next.js 16+ / Expo 55+ / Supabase / Drizzle ORM / Better Auth / react-native-quick-crypto

---

## Table of Contents

1. [Protocol Overview & How Signal Actually Works](#1-protocol-overview)
2. [The Four Cryptographic Layers](#2-the-four-cryptographic-layers)
3. [Key Types & Lifecycle](#3-key-types--lifecycle)
4. [1:1 Session Establishment (X3DH + Double Ratchet)](#4-11-session-establishment)
5. [Group Encryption (Sender Keys Protocol)](#5-group-encryption-sender-keys)
6. [Private Group Management (Groups V2)](#6-private-group-management)
7. [Authentication (Better Auth)](#7-authentication-better-auth)
8. [Server Database Schema — Drizzle + Supabase Postgres](#8-server-database-schema)
9. [Mobile Local Database — Drizzle + Expo SQLite](#9-mobile-local-database)
10. [Client-Side Crypto & Key Storage](#10-client-side-crypto--key-storage)
11. [Project Structure](#11-project-structure)
12. [Store Interfaces (Platform-Agnostic)](#12-store-interfaces)
13. [Sender Key Distribution Flow](#13-sender-key-distribution-flow)
14. [Group Message Send/Receive Flow](#14-group-message-sendreceive-flow)
15. [Member Add/Remove & Key Rotation](#15-member-addremove--key-rotation)
16. [Multi-Device Support](#16-multi-device-support)
17. [API Routes (Next.js Server)](#17-api-routes)
18. [Auth-to-Encryption Complete Flow](#18-auth-to-encryption-flow)
19. [Library & Technology Choices](#19-library--technology-choices)
20. [Security Considerations](#20-security-considerations)
21. [NPM Dependencies (Complete)](#21-npm-dependencies)
22. [Implementation Roadmap](#22-implementation-roadmap)
23. [Official Documentation Links](#23-official-documentation-links)

---

## 1. Protocol Overview

Signal uses a **layered encryption architecture** for group messaging. It is NOT simply
"encrypt once for the group." Instead, it combines two distinct protocols:

**Layer A — Pairwise Sessions (1:1):** Every pair of devices in the system shares a
Double Ratchet session established via X3DH (or the newer PQXDH) key agreement.
These sessions are used for all 1:1 messages AND for distributing Sender Keys.

**Layer B — Sender Keys (Group):** Each sender in a group generates their own
"Sender Key" — a chain key + signature key pair. This Sender Key is distributed to
every other group member over their pairwise sessions (Layer A). Once distributed,
the sender encrypts each group message ONCE with their Sender Key, and the server
fans it out to all group members who can each independently decrypt it.

This means: to send a group message, you encrypt **once** (O(1)), but to distribute
your Sender Key when you first join a group or when keys rotate, you encrypt it
**N times** (once per member, over each pairwise session).

### Why This Design?

The alternative ("Pairwise" variant) would require the sender to individually encrypt
every group message for every recipient — O(N) per message. With Sender Keys, the
expensive per-member operation only happens during key distribution, and actual message
sending is O(1).

### What the Server Sees

The server sees:

- Who is sending to which group (metadata)
- The encrypted ciphertext (opaque blob)
- Timing information

The server CANNOT see:

- Message plaintext
- Group names, avatars, or membership (in Groups V2)
- Sender Key material

---

## 2. The Four Cryptographic Layers

### Layer 1: Identity Keys (Long-term)

Each device generates a Curve25519 identity key pair at registration. This is the root
of trust. The public key is uploaded to the server and is used by other users to verify
your identity (safety numbers / fingerprint verification).

- **Algorithm:** Curve25519
- **Lifetime:** Permanent (per device installation)
- **Purpose:** Root identity, signing prekeys, trust verification

### Layer 2: X3DH Key Agreement (Session Establishment)

When Alice wants to message Bob for the first time, she performs an Extended Triple
Diffie-Hellman handshake using Bob's prekey bundle fetched from the server. This
produces a shared secret without Bob needing to be online.

**Bob's PreKey Bundle (uploaded at registration):**

- Identity Key (IK_B) — long-term public key
- Signed PreKey (SPK_B) — medium-term, signed by IK_B, rotated periodically
- One-Time PreKey (OPK_B) — ephemeral, used once then deleted from server

**Alice's X3DH Calculation (4 DH operations):**

```
DH1 = DH(IK_A, SPK_B)        # Alice identity × Bob signed prekey
DH2 = DH(EK_A, IK_B)         # Alice ephemeral × Bob identity
DH3 = DH(EK_A, SPK_B)        # Alice ephemeral × Bob signed prekey
DH4 = DH(EK_A, OPK_B)        # Alice ephemeral × Bob one-time prekey (if available)

SK = KDF(DH1 || DH2 || DH3 || DH4)   # Shared secret via HKDF
```

This shared secret SK becomes the initial root key for the Double Ratchet.

### Layer 3: Double Ratchet (Message Encryption)

Once a session is established, every message uses a unique message key derived from
a continuously evolving chain of keys. The Double Ratchet combines:

**Symmetric Ratchet (KDF Chain):**
Each message advances a chain key forward using HMAC-SHA256. Old chain keys are
deleted, providing forward secrecy — compromise of current keys cannot reveal past
messages.

```
Chain Key[n+1] = HMAC-SHA256(Chain Key[n], 0x02)
Message Key[n] = HMAC-SHA256(Chain Key[n], 0x01)
```

**Asymmetric Ratchet (DH Ratchet):**
Periodically (with each reply), parties exchange new ephemeral Curve25519 public keys.
The DH result is mixed into the root key to produce new chain keys, providing
post-compromise security — if keys are compromised, security self-heals once a new
DH exchange happens.

```
Root Key[n+1], Chain Key = KDF(Root Key[n], DH(ratchet_key_A, ratchet_key_B))
```

**Encryption per message:**

```
Plaintext → AES-256-CBC(Message Key) → Ciphertext
Ciphertext → HMAC-SHA256(Message Key) → MAC
```

### Layer 4: Sender Keys (Group Message Encryption)

For group messages, each sender maintains their own Sender Key state:

**Sender Key Components:**

- **Chain Key** (32 bytes, random) — used to derive per-message keys via symmetric ratchet
- **Signature Key** (Curve25519 key pair) — used to sign ciphertexts for authentication

**Per Group Message:**

```
Message Key = HMAC-SHA256(Chain Key, 0x01)
Chain Key   = HMAC-SHA256(Chain Key, 0x02)       # Ratchet forward

Ciphertext = AES-256-CBC(Message Key, plaintext)
Signature  = Sign(Signature Private Key, ciphertext)

Output = iteration_counter || ciphertext || signature
```

Recipients use the sender's stored chain key to derive the same message key and decrypt.
The iteration counter handles out-of-order delivery by allowing recipients to advance
their copy of the sender's chain key to the correct position.

---

## 3. Key Types & Lifecycle

| Key Type               | Algorithm     | Lifetime                       | Stored On                                 | Purpose                      |
|------------------------|---------------|--------------------------------|-------------------------------------------|------------------------------|
| Identity Key Pair      | Curve25519    | Permanent (per install)        | Client (private), Server (public)         | Root trust anchor            |
| Registration ID        | Random uint32 | Permanent                      | Client + Server                           | Device identifier            |
| Signed PreKey          | Curve25519    | Rotate every ~7-30 days        | Client (private), Server (public)         | Medium-term session init     |
| One-Time PreKeys       | Curve25519    | Single use, then deleted       | Client (private), Server (public)         | Ephemeral session init       |
| Root Key               | 32 bytes      | Evolves per DH ratchet step    | Client only                               | Derives new chain keys       |
| Sending Chain Key      | 32 bytes      | Evolves per message sent       | Client only                               | Derives message keys         |
| Receiving Chain Key    | 32 bytes      | Evolves per message received   | Client only                               | Derives message keys         |
| Message Key            | 32 bytes      | Single use, then deleted       | Ephemeral (memory)                        | Encrypts one message         |
| Sender Key (Chain)     | 32 bytes      | Until group membership changes | Client only                               | Group message key derivation |
| Sender Key (Signature) | Curve25519    | Until group membership changes | Client (private), Members (public)        | Group message authentication |
| Group Master Key       | 32 bytes      | Permanent per group            | Client only (shared with members via E2E) | Encrypts group metadata      |

---

## 4. 1:1 Session Establishment

This is the FOUNDATION. Group encryption depends on 1:1 sessions being established
first, because Sender Keys are distributed over 1:1 channels.

### Registration Flow

```
CLIENT (at install time):
  1. Generate Identity Key Pair (IK)
  2. Generate Registration ID (random uint32)
  3. Generate Signed PreKey (SPK), sign with IK private key
  4. Generate 100 One-Time PreKeys (OPK_1..OPK_100)
  5. Upload to server:
     - IK public key
     - Registration ID
     - SPK public key + signature + SPK ID
     - OPK_1..OPK_100 public keys + IDs
  6. Store locally (encrypted):
     - IK private key
     - SPK private key
     - OPK_1..OPK_100 private keys
     - Registration ID
```

### Session Building (Alice → Bob)

```
ALICE:
  1. Fetch Bob's PreKey Bundle from server:
     { identityKey, signedPreKey, signedPreKeySignature, signedPreKeyId,
       oneTimePreKey?, oneTimePreKeyId?, registrationId }

  2. Verify signedPreKeySignature using Bob's identityKey

  3. Generate ephemeral key pair (EK_A)

  4. Perform X3DH:
     DH1 = DH(IK_A_private, SPK_B)
     DH2 = DH(EK_A_private, IK_B)
     DH3 = DH(EK_A_private, SPK_B)
     DH4 = DH(EK_A_private, OPK_B)  // if OPK available

     masterSecret = DH1 || DH2 || DH3 [|| DH4]

  5. Derive root key and chain keys via HKDF:
     (rootKey, chainKey) = HKDF(salt=0, ikm=masterSecret, info="WhisperText")

  6. Create session state with:
     - rootKey
     - sending chain key
     - Bob's ratchet public key (SPK_B initially)
     - Alice's ratchet key pair (EK_A)

  7. First message is a PreKeyWhisperMessage containing:
     - Alice's identity key (public)
     - Alice's ephemeral key (public)
     - Bob's signed prekey ID
     - Bob's one-time prekey ID (if used)
     - Encrypted message content (using session)

BOB (on receiving first message):
  1. Extract prekey IDs from PreKeyWhisperMessage
  2. Look up corresponding private keys
  3. Perform same X3DH calculation
  4. Initialize session with same derived keys
  5. Decrypt message
  6. Delete used one-time prekey
  7. Session is now established for both directions
```

---

## 5. Group Encryption (Sender Keys)

This is the core of what you asked about. Here is exactly how Signal implements
group message encryption.

### Sender Key Generation

When a user first sends a message to a group (or when keys rotate), they generate
a new Sender Key:

```
SENDER (e.g., Alice in group "Engineers"):
  1. Generate random 32-byte Chain Key
  2. Generate random Curve25519 Signature Key Pair
  3. Combine into SenderKeyMessage:
     {
       senderKeyId: random uint32,
       iteration: 0,
       chainKey: <32 bytes>,
       signaturePublicKey: <Curve25519 public key>
     }
  4. For each member (Bob, Carol, Dave, ...):
     a. Look up existing 1:1 session with that member's device(s)
     b. Encrypt the SenderKeyMessage using SessionCipher (Double Ratchet)
     c. Send as a SenderKeyDistributionMessage via the server
  5. Store locally:
     - Chain Key (for deriving message keys when sending)
     - Signature Key Pair (private for signing, public stored by recipients)
     - Current iteration counter = 0
```

### Sender Key Distribution Message

This is a special message type sent over the 1:1 encrypted channel:

```protobuf
message SenderKeyDistributionMessage {
  uint32 id         = 1;  // Sender Key ID
  uint32 iteration  = 2;  // Current chain iteration
  bytes  chainKey   = 3;  // 32-byte chain key
  bytes  signingKey = 4;  // Curve25519 public signing key
}
```

### Group Message Encryption (Sending)

```
ALICE sends "Hello group!" to Engineers group:

  1. Get her Sender Key state for this group:
     { chainKey, signatureKeyPair, iteration }

  2. Derive message key:
     messageKey = HMAC-SHA256(chainKey, 0x01)

  3. Split message key into encryption components:
     (encKey, macKey, iv) = HKDF(messageKey, "WhisperGroup")

  4. Encrypt:
     ciphertext = AES-256-CBC(encKey, iv, "Hello group!")

  5. Sign:
     signature = Ed25519-Sign(signatureKeyPair.private, ciphertext)

  6. Advance chain:
     chainKey = HMAC-SHA256(chainKey, 0x02)
     iteration += 1

  7. Construct SenderKeyMessage:
     {
       senderKeyId: <Alice's key ID for this group>,
       iteration: <current iteration>,
       ciphertext: <encrypted message>,
       signature: <signature over ciphertext>
     }

  8. Send to server with group ID
     Server fans out the SAME encrypted blob to all group members
```

### Group Message Decryption (Receiving)

```
BOB receives Alice's SenderKeyMessage:

  1. Look up Alice's Sender Key state (stored from distribution):
     { chainKey, signaturePublicKey, lastIteration }

  2. Compute how many ratchet steps needed:
     stepsNeeded = message.iteration - lastIteration

  3. If stepsNeeded > 0 AND stepsNeeded < MAX_FORWARD_JUMPS (2000):
     Advance chain key forward stepsNeeded times:
     for i in range(stepsNeeded):
       skippedMessageKey = HMAC-SHA256(chainKey, 0x01)  // save for out-of-order
       chainKey = HMAC-SHA256(chainKey, 0x02)

  4. Derive message key for this specific iteration:
     messageKey = HMAC-SHA256(chainKey, 0x01)

  5. Verify signature:
     Ed25519-Verify(Alice.signaturePublicKey, message.ciphertext, message.signature)
     → If invalid, REJECT message

  6. Derive encryption components:
     (encKey, macKey, iv) = HKDF(messageKey, "WhisperGroup")

  7. Decrypt:
     plaintext = AES-256-CBC-Decrypt(encKey, iv, message.ciphertext)

  8. Advance stored chain key:
     chainKey = HMAC-SHA256(chainKey, 0x02)
     lastIteration = message.iteration

  9. Return plaintext: "Hello group!"
```

### Out-of-Order Message Handling

The Sender Keys protocol handles out-of-order delivery through skipped message keys:

```
If Bob receives iteration 5 but has only processed up to iteration 2:
  1. Compute and STORE message keys for iterations 3 and 4
  2. Process iteration 5 normally
  3. When iterations 3 or 4 arrive later, use stored keys
  4. Delete stored keys after use (or after timeout)
  
Maximum forward skip: ~2000 iterations (configurable)
If exceeded: reject message, request Sender Key re-distribution
```

---

## 6. Private Group Management (Groups V2 — Full Zero-Knowledge)

Signal's Groups V2 uses a cryptographic system where the server stores group state
(membership, roles, title, avatar) in ENCRYPTED form. Members authenticate to the
server using zero-knowledge anonymous credentials (KVACs) — the server verifies they
belong to the group WITHOUT learning WHICH member they are.

This section describes the FULL system as specified in the paper "The Signal Private
Group System" by Chase, Perrin, and Zaverucha (https://eprint.iacr.org/2019/1416.pdf)
and implemented in Signal's `zkgroup` library (part of `@signalapp/libsignal-client`).

### Core Cryptographic Primitives Required

| Primitive                       | Purpose                                                           | Library                         |
|---------------------------------|-------------------------------------------------------------------|---------------------------------|
| Algebraic MAC (MACGGM)          | Server issues credentials without seeing attributes               | Custom (implement per paper)    |
| Elgamal Encryption              | Deterministic encryption of UIDs and ProfileKeys in group entries | Custom over Ristretto255        |
| Schnorr ZK Proofs (Fiat-Shamir) | Prove credential ownership without revealing identity             | Custom (poksho-style)           |
| Ristretto255 Group              | Prime-order group for all ZK operations                           | `@noble/curves` (ristretto255)  |
| HKDF / SHA-256                  | Key derivation for GroupSecretParams                              | `@noble/hashes` or quick-crypto |

### Key Objects in the System

**ServerSecretParams / ServerPublicParams:**
Generated ONCE by your server at deployment. The server uses ServerSecretParams to
issue credentials. All clients receive ServerPublicParams to verify credentials.

```
SERVER (at deployment):
  serverSecretParams = ServerSecretParams.generate()
  serverPublicParams = serverSecretParams.getPublicParams()
  // serverPublicParams is distributed to ALL clients (hardcoded or via config)
  // serverSecretParams NEVER leaves the server
```

**AuthCredential:**
A time-limited credential issued by the server to each user for their own UID. The
server issues it knowing the user's UID, but when the user PRESENTS it to access a
group, the presentation is randomized so the server cannot link it back.

```
CREDENTIAL ISSUANCE (daily, for each authenticated user):
  Client:
    1. Authenticate normally (Better Auth session)
    2. Request AuthCredential for today's date

  Server:
    1. Verify user is authenticated (knows their UID from session)
    2. Compute: authCredential = MAC(serverSecretParams, uid, redemptionDate)
    3. Create AuthCredentialResponse with proof of correct issuance
    4. Return AuthCredentialResponse to client

  Client:
    1. Verify server's proof using ServerPublicParams
    2. Store authCredential locally
    3. Credential is valid for a short window (e.g., 7 days)
```

**ProfileKey + ProfileKeyCredential:**
Each user has a 32-byte ProfileKey that encrypts their profile data (name, avatar).
Users share their ProfileKey with trusted contacts via E2E messages. A
ProfileKeyCredential certifies that a UID is associated with a ProfileKey, issued
via a blinded protocol so the server never learns the ProfileKey.

```
PROFILE KEY CREDENTIAL ISSUANCE:
  Client (Alice, who knows Bob's ProfileKey):
    1. Derive ProfileKeyCommitment from Bob's ProfileKey
    2. Create ProfileKeyCredentialRequest (blinded)
    3. Send (Bob's UID, ProfileKeyVersion, request) to server

  Server:
    1. Verify ProfileKeyVersion matches stored commitment for Bob's UID
    2. Issue blinded ProfileKeyCredentialResponse
    3. Server NEVER learns Bob's actual ProfileKey

  Client:
    1. Unblind the response to obtain ProfileKeyCredential
    2. This credential certifies (Bob's UID, Bob's ProfileKey) pair
```

**GroupMasterKey + GroupSecretParams:**
Each group has a random 32-byte GroupMasterKey. GroupSecretParams are derived from it
deterministically. GroupSecretParams are used to encrypt/decrypt all group state.

```
GROUP KEY HIERARCHY:
  GroupMasterKey (32 bytes, random)
    └─ derive → GroupSecretParams
                  ├─ UID encryption key     (encrypts member UUIDs)
                  ├─ ProfileKey encryption key (encrypts member ProfileKeys)
                  ├─ Blob encryption key    (encrypts title, avatar, description)
                  └─ Group ID               (public identifier for the group)
```

### Group Creation (Full Protocol)

```
CREATOR (Alice):
  1. Generate random 32-byte GroupMasterKey
  2. Derive GroupSecretParams from GroupMasterKey
  3. Derive groupId from GroupSecretParams (this is public, sent to server)

  4. For each member (including herself):
     a. Encrypt their UID:
        uidCiphertext = GroupSecretParams.encryptUid(member.uuid)
     b. Encrypt their ProfileKey:
        profileKeyCiphertext = GroupSecretParams.encryptProfileKey(member.profileKey)
     c. Prove she has a ProfileKeyCredential for this (UID, ProfileKey) pair
        → Zero-knowledge proof that the ciphertexts are correctly formed

  5. Encrypt group attributes:
     encryptedTitle = GroupSecretParams.encryptBlob("Engineers")
     encryptedAvatar = GroupSecretParams.encryptBlob(avatarBytes)
     encryptedDescription = GroupSecretParams.encryptBlob("Our team chat")

  6. Create AuthCredentialPresentation:
     → ZK proof: "I have a valid AuthCredential matching one of these
        uidCiphertexts, but I won't tell you which one"

  7. Send to server:
     {
       groupId,
       version: 0,
       encryptedTitle, encryptedAvatar, encryptedDescription,
       members: [
         { uidCiphertext, profileKeyCiphertext, role: ADMIN, joinedAtVersion: 0 },
         { uidCiphertext, profileKeyCiphertext, role: MEMBER, joinedAtVersion: 0 },
         ...
       ],
       accessControl: { members: MEMBER, attributes: ADMIN },
       authCredentialPresentation  // proves Alice belongs, without revealing which entry
     }

  8. Server verifies:
     a. AuthCredentialPresentation is valid (some entry matches)
     b. Role associated with that entry has permission to create
     c. All ProfileKeyCredential proofs are valid
     d. Stores the ENCRYPTED group state — server sees ONLY ciphertexts

  9. Alice sends GroupMasterKey to each member via 1:1 E2E encrypted message
     (also included in each group message as backup, E2E encrypted)
```

### Fetching Group State (Anonymous)

```
BOB (wants to read group state):
  1. Derive GroupSecretParams from his stored GroupMasterKey
  2. Compute his own uidCiphertext = GroupSecretParams.encryptUid(myUid)
  3. Create AuthCredentialPresentation proving he matches some entry

  4. Send to server: GET /groups/{groupId}
     Header: Authorization: <AuthCredentialPresentation>
     (NO session cookie, NO user ID — completely anonymous to server)

  5. Server verifies presentation is valid for some member entry
  6. Server returns encrypted group state

  7. Bob decrypts locally:
     title = GroupSecretParams.decryptBlob(encryptedTitle)
     for each member entry:
       uid = GroupSecretParams.decryptUid(entry.uidCiphertext)
       profileKey = GroupSecretParams.decryptProfileKey(entry.profileKeyCiphertext)
```

### Adding a Member (Anonymous)

```
ALICE (admin, adding Carol):
  1. Create new member entry:
     carolUidCiphertext = GroupSecretParams.encryptUid(carol.uuid)
     carolProfileKeyCiphertext = GroupSecretParams.encryptProfileKey(carol.profileKey)
     Prove: ProfileKeyCredential for (carol.uuid, carol.profileKey)

  2. Create GroupChange protobuf:
     {
       addMembers: [{
         uidCiphertext: carolUidCiphertext,
         profileKeyCiphertext: carolProfileKeyCiphertext,
         role: MEMBER,
         joinedAtVersion: currentVersion + 1
       }],
       sourceVersion: currentVersion,
       targetVersion: currentVersion + 1,
     }

  3. Create AuthCredentialPresentation for herself
     → Proves she is SOME member, server checks that member has admin role

  4. Send PATCH /groups/{groupId} with presentation + GroupChange

  5. Server:
     a. Verifies Alice's presentation matches an admin entry
     b. Applies the change atomically
     c. Increments version
     d. Returns updated group state

  6. Alice sends GroupMasterKey to Carol via 1:1 E2E message
```

### Removing a Member

```
ADMIN (removing Eve):
  1. Compute Eve's uidCiphertext = GroupSecretParams.encryptUid(eve.uuid)
     (Deterministic, so it matches the stored ciphertext)

  2. Create GroupChange:
     { removeMembers: [eveUidCiphertext], sourceVersion, targetVersion }

  3. Present AuthCredentialPresentation (anonymous)

  4. Server verifies, applies change, bumps version

  5. ALL remaining members MUST rotate their Sender Keys
     (Eve had everyone's old Sender Keys — see Section 15)
```

### Server-Side Group Storage (What the Server Sees)

The server stores ONLY encrypted blobs. A server database dump looks like this:

```
| group_id        | version | encrypted_title          | members (encrypted)                        |
|-----------------|---------|--------------------------|-------------------------------------------|
| 0xA3F2...       | 7       | "E2jP6c8LB8ESLdTNy..."  | [{uid: "2wb5fL...", pk: "Y+bt/q...", ...}] |
| 0xB1C4...       | 3       | "vNea+GD5bETfL4..."      | [{uid: "dil09Q...", pk: "+v2Hh1...", ...}] |
```

The server CANNOT:

- Read group names, avatars, or descriptions
- Determine which users are in which groups
- Link an authentication request to a specific member
- Decrypt any member UID or ProfileKey

The server CAN:

- Enforce version ordering (reject stale updates)
- Enforce access control based on encrypted role entries
- Rate-limit requests per group
- See group size (number of encrypted member entries)

### Implementation Strategy for KVAC

The zkgroup operations are implemented in Rust inside Signal's `libsignal` repository.
For your implementation, you have two paths:

**Path 1 (Server-side only): Use `@signalapp/libsignal-client` on your Next.js server.**
The `zkgroup` module is exposed via the TypeScript bindings. Your server runs the
credential issuance (ServerZkAuthOperations, ServerZkProfileOperations) and verification
(ServerZkGroupOperations). Note: this package includes native Rust binaries and works
on Node.js but NOT in the browser.

```typescript
// SERVER SIDE ONLY — apps/web/lib/zkgroup.ts
import {
    ServerSecretParams,
    ServerZkAuthOperations,
    ServerZkProfileOperations,
    GroupSecretParams,
    GroupMasterKey,
    ClientZkAuthOperations,
    ClientZkGroupCipher,
    ClientZkProfileOperations,
    AuthCredentialWithPniResponse,
    ServerPublicParams,
} from '@signalapp/libsignal-client/zkgroup';
```

**Path 2 (Full custom): Implement the KVAC primitives from the paper.**
This means implementing algebraic MACs over Ristretto255 (using `@noble/curves`),
the Elgamal-like encryption, and the Schnorr/Fiat-Shamir ZK proofs. This is a
multi-month cryptographic engineering effort but gives you full control and no
native binary dependencies.

**Recommended: Path 1 for the server, with client-side operations using a
portable TypeScript wrapper that delegates to `@signalapp/libsignal-client`
on Node.js and to a custom Ristretto255 implementation on mobile (using
`@noble/curves`).** The client-side operations (encrypt UID, create presentation,
decrypt group state) are less complex than the server-side credential issuance.

### Group API Endpoints (Server)

Your server needs these endpoints for the full Groups V2 system:

```
POST   /api/groups/credentials/auth          # Issue AuthCredentials (daily)
POST   /api/groups/credentials/profile-key   # Issue ProfileKeyCredentials (blinded)

PUT    /api/groups/{groupId}                 # Create group (with presentation)
GET    /api/groups/{groupId}                 # Fetch group state (with presentation)
PATCH  /api/groups/{groupId}                 # Modify group (with presentation + GroupChange)
GET    /api/groups/{groupId}/logs/{fromVersion}  # Fetch change log since version
```

All group endpoints authenticate via AuthCredentialPresentation (ZK proof),
NOT via Better Auth session cookies. The credential endpoints DO use Better Auth
sessions because the server needs to know which UID to issue credentials for.

---

## 7. Authentication (Better Auth)

Better Auth handles user authentication. It creates its own tables (user, session,
account, verification) that coexist with your encryption tables in Supabase.

### Server Auth Configuration

```typescript
// apps/web/lib/auth.ts
import {betterAuth} from "better-auth";
import {drizzleAdapter} from "better-auth/adapters/drizzle";
import {expo} from "@better-auth/expo";
import {nextCookies} from "better-auth/next-js";
import {db} from "@/lib/db";
import * as schema from "@/lib/db/schema";

export const auth = betterAuth({
    database: drizzleAdapter(db, {
        provider: "pg",
        schema,              // Pass your Drizzle schema for type safety
    }),
    emailAndPassword: {
        enabled: true,
    },
    plugins: [
        expo(),              // Enables Expo deep-link auth flows
        nextCookies(),       // Auto-sets cookies in Server Actions (MUST be last)
    ],
    trustedOrigins: [
        "myapp://",          // Your Expo app scheme
        ...(process.env.NODE_ENV === "development" ? [
            "exp://**",        // Expo dev client
        ] : []),
    ],
});
```

### Next.js 16+ API Route

```typescript
// apps/web/app/api/auth/[...all]/route.ts
import {auth} from "@/lib/auth";
import {toNextJsHandler} from "better-auth/next-js";

export const {GET, POST} = toNextJsHandler(auth);
```

### Next.js 16+ Proxy (replaces middleware)

```typescript
// apps/web/proxy.ts
import {NextRequest, NextResponse} from "next/server";
import {headers} from "next/headers";
import {auth} from "@/lib/auth";

export async function proxy(request: NextRequest) {
    const session = await auth.api.getSession({
        headers: await headers()
    });
    if (!session) {
        return NextResponse.redirect(new URL("/sign-in", request.url));
    }
    return NextResponse.next();
}

export const config = {
    matcher: ["/dashboard", "/chat/:path*"],
};
```

### Next.js Client

```typescript
// apps/web/lib/auth-client.ts
import {createAuthClient} from "better-auth/react";

export const authClient = createAuthClient({
    // baseURL defaults to current origin in Next.js
});
```

### Expo Client

```typescript
// apps/mobile/lib/auth-client.ts
import {createAuthClient} from "better-auth/react";
import {expoClient} from "@better-auth/expo/client";
import * as SecureStore from "expo-secure-store";

export const authClient = createAuthClient({
    baseURL: process.env.EXPO_PUBLIC_API_URL!,  // Your Next.js server URL
    plugins: [
        expoClient({
            scheme: "myapp",
            storagePrefix: "myapp",
            storage: SecureStore,      // Cookies stored in Keychain/Keystore
        }),
    ],
});
```

### Getting the Authenticated User ID (Critical for Encryption)

The user ID from Better Auth is the identity that maps to encryption keys.
Every device registration, prekey upload, and group membership links back to this ID.

```typescript
// Server-side (RSC or Server Action)
import {auth} from "@/lib/auth";
import {headers} from "next/headers";

export async function getCurrentUserId(): Promise<string> {
    const session = await auth.api.getSession({headers: await headers()});
    if (!session) throw new Error("Not authenticated");
    return session.user.id;  // This is the user ID used throughout the encryption system
}

// Client-side (React component — works in both Next.js and Expo)
import {authClient} from "@/lib/auth-client";

function ChatScreen() {
    const {data: session} = authClient.useSession();
    const userId = session?.user.id;  // Same ID, used client-side
}
```

---

## 8. Server Database Schema — Drizzle + Supabase Postgres

### Database Connection

```typescript
// apps/web/lib/db/index.ts
import {drizzle} from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

// Use Supabase connection pooler (Transaction mode)
const client = postgres(process.env.DATABASE_URL!, {prepare: false});
export const db = drizzle({client, schema});
```

### Drizzle Config

```typescript
// apps/web/drizzle.config.ts
import {defineConfig} from "drizzle-kit";

export default defineConfig({
    schema: "./lib/db/schema/index.ts",
    out: "./supabase/migrations",
    dialect: "postgresql",
    dbCredentials: {
        url: process.env.DATABASE_URL!,
    },
});
```

### Server Drizzle Schema (Supabase Postgres)

This replaces the raw SQL from the main architecture document with proper Drizzle schemas.
Better Auth's tables (user, session, account, verification) are auto-managed by Better Auth
CLI — you generate them with `npx @better-auth/cli generate`.

```typescript
// apps/web/lib/db/schema/auth-schema.ts
// AUTO-GENERATED by: npx @better-auth/cli generate --output ./lib/db/schema/auth-schema.ts
// This creates: user, session, account, verification tables
// DO NOT manually edit — re-run the CLI if you change auth config

import {pgTable, text, timestamp, boolean} from "drizzle-orm/pg-core";

export const user = pgTable("user", {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    email: text("email").notNull().unique(),
    emailVerified: boolean("email_verified").notNull(),
    image: text("image"),
    createdAt: timestamp("created_at").notNull(),
    updatedAt: timestamp("updated_at").notNull(),
});

export const session = pgTable("session", {
    id: text("id").primaryKey(),
    expiresAt: timestamp("expires_at").notNull(),
    token: text("token").notNull().unique(),
    createdAt: timestamp("created_at").notNull(),
    updatedAt: timestamp("updated_at").notNull(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    userId: text("user_id").notNull().references(() => user.id),
});

export const account = pgTable("account", {
    id: text("id").primaryKey(),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    userId: text("user_id").notNull().references(() => user.id),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: timestamp("access_token_expires_at"),
    refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
    scope: text("scope"),
    password: text("password"),
    createdAt: timestamp("created_at").notNull(),
    updatedAt: timestamp("updated_at").notNull(),
});

export const verification = pgTable("verification", {
    id: text("id").primaryKey(),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: timestamp("expires_at").notNull(),
    createdAt: timestamp("created_at"),
    updatedAt: timestamp("updated_at"),
});
```

```typescript
// apps/web/lib/db/schema/encryption-schema.ts
// YOUR encryption tables — these you write and maintain yourself

import {pgTable, text, integer, boolean, timestamp, bigint, uuid, uniqueIndex} from "drizzle-orm/pg-core";
import {relations} from "drizzle-orm";
import {user} from "./auth-schema";

// ── Devices ──────────────────────────────────────────────
export const devices = pgTable("devices", {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id").notNull().references(() => user.id, {onDelete: "cascade"}),
    deviceId: integer("device_id").notNull(),
    registrationId: integer("registration_id").notNull(),
    identityKeyPublic: text("identity_key_public").notNull(),
    platform: text("platform"),           // 'web' | 'ios' | 'android'
    pushToken: text("push_token"),
    lastSeenAt: timestamp("last_seen_at").defaultNow(),
    isActive: boolean("is_active").default(true),
    createdAt: timestamp("created_at").defaultNow(),
}, (t) => [
    uniqueIndex("devices_user_device_idx").on(t.userId, t.deviceId),
]);

// ── Signed PreKeys ───────────────────────────────────────
export const signedPrekeys = pgTable("signed_prekeys", {
    id: uuid("id").defaultRandom().primaryKey(),
    deviceId: uuid("device_id").notNull().references(() => devices.id, {onDelete: "cascade"}),
    keyId: integer("key_id").notNull(),
    publicKey: text("public_key").notNull(),
    signature: text("signature").notNull(),
    createdAt: timestamp("created_at").defaultNow(),
}, (t) => [
    uniqueIndex("spk_device_key_idx").on(t.deviceId, t.keyId),
]);

// ── One-Time PreKeys ─────────────────────────────────────
export const oneTimePrekeys = pgTable("one_time_prekeys", {
    id: uuid("id").defaultRandom().primaryKey(),
    deviceId: uuid("device_id").notNull().references(() => devices.id, {onDelete: "cascade"}),
    keyId: integer("key_id").notNull(),
    publicKey: text("public_key").notNull(),
    used: boolean("used").default(false),
    createdAt: timestamp("created_at").defaultNow(),
}, (t) => [
    uniqueIndex("otp_device_key_idx").on(t.deviceId, t.keyId),
]);

// ── Groups (server sees ONLY encrypted blobs) ───────────
export const groups = pgTable("groups", {
    id: text("id").primaryKey(),               // Derived from GroupSecretParams (public)

    // ALL metadata is encrypted with GroupSecretParams — server cannot read any of it
    encryptedTitle: text("encrypted_title"),
    encryptedAvatar: text("encrypted_avatar"),
    encryptedDescription: text("encrypted_description"),
    encryptedDisappearingMessageTimer: text("encrypted_disappearing_timer"),

    // Version counter — the ONLY plaintext field the server uses for ordering
    version: integer("version").default(0).notNull(),

    // Access control (stored as encrypted role ciphertexts, but server can
    // verify against presentation proofs without decrypting)
    accessMembers: integer("access_members").default(1),     // 0=ANY, 1=MEMBER, 2=ADMIN
    accessAttributes: integer("access_attributes").default(1),
    accessAddFromInviteLink: integer("access_add_from_invite_link").default(0),

    // Invite link (encrypted)
    encryptedInviteLinkPassword: text("encrypted_invite_link_password"),

    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
});

// ── Group Members (encrypted entries — server cannot read UIDs) ──
// Each member entry contains ENCRYPTED UID + ENCRYPTED ProfileKey.
// The server CANNOT decrypt these. It can only verify ZK proofs against them.
export const groupMembers = pgTable("group_members", {
    id: uuid("id").defaultRandom().primaryKey(),
    groupId: text("group_id").notNull().references(() => groups.id, {onDelete: "cascade"}),

    // ENCRYPTED member identity — server sees only ciphertext
    uidCiphertext: text("uid_ciphertext").notNull(),            // Elgamal encryption of member UUID
    profileKeyCiphertext: text("profile_key_ciphertext").notNull(), // Elgamal encryption of ProfileKey

    // Role (server CAN verify this via ZK proof during access control checks)
    role: integer("role").default(1).notNull(),   // 0=UNKNOWN, 1=DEFAULT, 2=ADMINISTRATOR

    // Presentation proof (cached for server-side verification)
    presentation: text("presentation"),           // ProfileKeyCredentialPresentation that created this entry

    joinedAtVersion: integer("joined_at_version").default(0).notNull(),
    createdAt: timestamp("created_at").defaultNow(),
}, (t) => [
    uniqueIndex("gm_group_uid_idx").on(t.groupId, t.uidCiphertext),
]);

// ── Group Pending Members (invited but not yet joined) ───
export const groupPendingMembers = pgTable("group_pending_members", {
    id: uuid("id").defaultRandom().primaryKey(),
    groupId: text("group_id").notNull().references(() => groups.id, {onDelete: "cascade"}),
    uidCiphertext: text("uid_ciphertext").notNull(),
    role: integer("role").default(1).notNull(),
    addedByUidCiphertext: text("added_by_uid_ciphertext").notNull(),
    addedAtVersion: integer("added_at_version").notNull(),
    createdAt: timestamp("created_at").defaultNow(),
});

// ── Server ZK Params (one row, generated at deployment) ──
export const serverZkParams = pgTable("server_zk_params", {
    id: integer("id").primaryKey().default(1),
    // ServerSecretParams — NEVER exposed to clients
    secretParams: text("secret_params").notNull(),          // base64 serialized
    // ServerPublicParams — distributed to all clients
    publicParams: text("public_params").notNull(),          // base64 serialized
    createdAt: timestamp("created_at").defaultNow(),
});

// ── Auth Credential Issuance Log (rate limiting + audit) ─
export const authCredentialRequests = pgTable("auth_credential_requests", {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id").notNull().references(() => user.id),
    redemptionDate: integer("redemption_date").notNull(),   // days since epoch
    issuedAt: timestamp("issued_at").defaultNow(),
}, (t) => [
    uniqueIndex("acr_user_date_idx").on(t.userId, t.redemptionDate),
]);

// ── Profile Key Commitments (registered by users) ────────
export const profileKeyCommitments = pgTable("profile_key_commitments", {
    userId: text("user_id").primaryKey().references(() => user.id),
    profileKeyVersion: text("profile_key_version").notNull(),
    profileKeyCommitment: text("profile_key_commitment").notNull(), // base64 commitment
    updatedAt: timestamp("updated_at").defaultNow(),
});

// ── Sender Key Distributions ─────────────────────────────
export const senderKeyDistributions = pgTable("sender_key_distributions", {
    id: uuid("id").defaultRandom().primaryKey(),
    senderUserId: text("sender_user_id").notNull().references(() => user.id),
    senderDeviceId: uuid("sender_device_id").notNull().references(() => devices.id),
    groupId: uuid("group_id").notNull().references(() => groups.id, {onDelete: "cascade"}),
    recipientDeviceId: uuid("recipient_device_id").notNull().references(() => devices.id),
    senderKeyId: integer("sender_key_id").notNull(),
    distributionId: uuid("distribution_id").notNull(),
    status: text("status").default("pending"),
    createdAt: timestamp("created_at").defaultNow(),
    deliveredAt: timestamp("delivered_at"),
});

// ── Messages ─────────────────────────────────────────────
export const messages = pgTable("messages", {
    id: uuid("id").defaultRandom().primaryKey(),
    senderUserId: text("sender_user_id").notNull().references(() => user.id),
    senderDeviceId: uuid("sender_device_id").notNull().references(() => devices.id),
    recipientUserId: text("recipient_user_id"),
    recipientDeviceId: uuid("recipient_device_id"),
    groupId: uuid("group_id"),
    messageType: text("message_type").notNull(),
    ciphertext: text("ciphertext").notNull(),
    timestamp: bigint("timestamp", {mode: "number"}).notNull(),
    serverTimestamp: timestamp("server_timestamp").defaultNow(),
    delivered: boolean("delivered").default(false),
    read: boolean("read").default(false),
    senderKeyId: integer("sender_key_id"),
});

// ── Group State Changelog (versioned, all entries encrypted) ──
export const groupStateChangelog = pgTable("group_state_changelog", {
    id: uuid("id").defaultRandom().primaryKey(),
    groupId: text("group_id").notNull().references(() => groups.id, {onDelete: "cascade"}),
    version: integer("version").notNull(),

    // WHO made the change — stored as encrypted UID ciphertext, NOT plaintext
    changedByUidCiphertext: text("changed_by_uid_ciphertext").notNull(),

    // What changed (serialized GroupChange protobuf, encrypted)
    changeType: text("change_type").notNull(),
    encryptedChangeData: text("encrypted_change_data"),

    createdAt: timestamp("created_at").defaultNow(),
}, (t) => [
    uniqueIndex("gsc_group_version_idx").on(t.groupId, t.version),
]);

// ── Relations (for Drizzle relational queries) ───────────
export const devicesRelations = relations(devices, ({one, many}) => ({
    user: one(user, {fields: [devices.userId], references: [user.id]}),
    signedPrekeys: many(signedPrekeys),
    oneTimePrekeys: many(oneTimePrekeys),
}));

export const groupMembersRelations = relations(groupMembers, ({one}) => ({
    group: one(groups, {fields: [groupMembers.groupId], references: [groups.id]}),
    // NOTE: No FK to user table — the server cannot resolve uidCiphertext to a user
}));
```

```typescript
// apps/web/lib/db/schema/index.ts
// Barrel export — this is what you pass to drizzle() and Better Auth

export * from "./auth-schema";
export * from "./encryption-schema";
```

### Generating & Running Migrations

```bash
# Generate Better Auth tables first
npx @better-auth/cli generate --output ./lib/db/schema/auth-schema.ts

# Generate SQL migrations from all Drizzle schemas
npx drizzle-kit generate

# Apply migrations to Supabase
npx drizzle-kit migrate

# Or push directly (dev only)
npx drizzle-kit push
```

---

### Supabase Realtime Channel Setup

```sql
-- Enable realtime for message delivery
ALTER
PUBLICATION supabase_realtime ADD TABLE messages;

-- Enable realtime for group state changes
ALTER
PUBLICATION supabase_realtime ADD TABLE group_state_changelog;

-- Enable realtime for sender key distributions
ALTER
PUBLICATION supabase_realtime ADD TABLE sender_key_distributions;

-- Row Level Security (server should not expose messages to wrong recipients)
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

CREATE
POLICY "Users receive their own 1:1 messages"
  ON messages FOR
SELECT
    USING (
    recipient_user_id = auth.uid()
    OR sender_user_id = auth.uid()
    );

CREATE
POLICY "Users receive their group messages"
  ON messages FOR
SELECT
    USING (
    -- For group messages, RLS cannot check membership directly because
    -- group_members stores encrypted UIDs, not plaintext.
    -- Instead, group message delivery is handled at the APPLICATION layer:
    -- the server verifies AuthCredentialPresentations on the group API,
    -- and Supabase Realtime subscriptions are managed via server-side channels.
    -- This policy allows delivery of messages where the server has already
    -- verified access (messages are inserted by the server after verification).
    group_id IS NOT NULL
    OR recipient_user_id = auth.uid()
    OR sender_user_id = auth.uid()
    );

CREATE
POLICY "Users can send messages"
  ON messages FOR INSERT
  WITH CHECK (sender_user_id = auth.uid());
```

## 9. Mobile Local Database — Drizzle + Expo SQLite

The mobile app stores ALL private key material in a LOCAL SQLite database on the device.
This database is NEVER synced to the server. It uses Drizzle's Expo SQLite driver.

### Setup

```bash
# In your Expo app directory
npx expo install expo-sqlite
npm install drizzle-orm
npm install -D drizzle-kit babel-plugin-inline-import
```

### babel.config.js (extends the one from quick-crypto setup)

```javascript
module.exports = function (api) {
    api.cache(true);
    return {
        presets: ["babel-preset-expo"],
        plugins: [
            ["inline-import", {extensions: [".sql"]}],       // Drizzle migrations
            ["module-resolver", {
                alias: {
                    "crypto": "react-native-quick-crypto",          // Quick Crypto
                    "stream": "readable-stream",
                    "buffer": "react-native-quick-crypto",
                },
            }],
        ],
    };
};
```

### metro.config.js (combined: quick-crypto + Drizzle)

```javascript
const {getDefaultConfig} = require("expo/metro-config");
const config = getDefaultConfig(__dirname);

// Drizzle: allow .sql file imports
config.resolver.sourceExts.push("sql");

// Quick Crypto: resolve 'crypto' to native implementation
config.resolver.resolveRequest = (context, moduleName, platform) => {
    if (moduleName === "crypto") {
        return context.resolveRequest(context, "react-native-quick-crypto", platform);
    }
    return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
```

### drizzle.config.ts (for mobile)

```typescript
// apps/mobile/drizzle.config.ts
import {defineConfig} from "drizzle-kit";

export default defineConfig({
    schema: "./lib/db/schema.ts",
    out: "./drizzle",
    dialect: "sqlite",
    driver: "expo",            // CRITICAL: must be "expo" for Expo SQLite
});
```

### Mobile SQLite Schema

```typescript
// apps/mobile/lib/db/schema.ts
import {sqliteTable, text, integer, blob} from "drizzle-orm/sqlite-core";

// ── Identity Keys (one row per device installation) ──────
export const identityKeys = sqliteTable("identity_keys", {
    id: integer("id").primaryKey({autoIncrement: true}),
    registrationId: integer("registration_id").notNull(),
    publicKey: text("public_key").notNull(),      // base64 Curve25519 public
    privateKey: text("private_key").notNull(),     // base64 Curve25519 private (ENCRYPTED)
    createdAt: integer("created_at", {mode: "timestamp"}),
});

// ── PreKeys (our unused one-time prekeys) ────────────────
export const prekeys = sqliteTable("prekeys", {
    keyId: integer("key_id").primaryKey(),
    publicKey: text("public_key").notNull(),
    privateKey: text("private_key").notNull(),     // ENCRYPTED at rest
    uploaded: integer("uploaded", {mode: "boolean"}).default(false),
});

// ── Signed PreKeys ───────────────────────────────────────
export const signedPrekeys = sqliteTable("signed_prekeys_local", {
    keyId: integer("key_id").primaryKey(),
    publicKey: text("public_key").notNull(),
    privateKey: text("private_key").notNull(),     // ENCRYPTED at rest
    signature: text("signature").notNull(),
    createdAt: integer("created_at", {mode: "timestamp"}),
});

// ── Sessions (Double Ratchet state per remote device) ────
export const sessions = sqliteTable("sessions", {
    id: integer("id").primaryKey({autoIncrement: true}),
    // Address = remoteUserId + "." + remoteDeviceId
    address: text("address").notNull().unique(),
    // Serialized Double Ratchet session state (ENCRYPTED)
    sessionData: text("session_data").notNull(),
    updatedAt: integer("updated_at", {mode: "timestamp"}),
});

// ── Sender Keys (our Sender Key per group) ───────────────
export const senderKeys = sqliteTable("sender_keys", {
    id: integer("id").primaryKey({autoIncrement: true}),
    // groupId + ":" + senderAddress
    compositeKey: text("composite_key").notNull().unique(),
    // Serialized Sender Key state (ENCRYPTED)
    senderKeyData: text("sender_key_data").notNull(),
    updatedAt: integer("updated_at", {mode: "timestamp"}),
});

// ── Local Message Cache ──────────────────────────────────
export const localMessages = sqliteTable("local_messages", {
    id: text("id").primaryKey(),               // Same UUID as server
    groupId: text("group_id"),
    senderUserId: text("sender_user_id").notNull(),
    plaintext: text("plaintext").notNull(),    // Decrypted message body
    timestamp: integer("timestamp").notNull(),
    status: text("status").default("received"),  // sent | received | read
});

// ── Skipped Message Keys (for out-of-order delivery) ─────
export const skippedKeys = sqliteTable("skipped_keys", {
    id: integer("id").primaryKey({autoIncrement: true}),
    address: text("address").notNull(),        // sender address
    messageIndex: integer("message_index").notNull(),
    messageKey: text("message_key").notNull(), // ENCRYPTED
    createdAt: integer("created_at", {mode: "timestamp"}),
});

// ── ZK Credentials (Groups V2 anonymous authentication) ──
export const authCredentials = sqliteTable("auth_credentials", {
    id: integer("id").primaryKey({autoIncrement: true}),
    redemptionDate: integer("redemption_date").notNull().unique(), // days since epoch
    credentialData: text("credential_data").notNull(),  // serialized AuthCredentialWithPni
    expiresAt: integer("expires_at", {mode: "timestamp"}).notNull(),
});

export const profileKeyCredentials = sqliteTable("profile_key_credentials", {
    id: integer("id").primaryKey({autoIncrement: true}),
    // Which user's (UID, ProfileKey) this credential certifies
    targetUserId: text("target_user_id").notNull().unique(),
    credentialData: text("credential_data").notNull(),  // serialized ExpiringProfileKeyCredential
    expiresAt: integer("expires_at", {mode: "timestamp"}).notNull(),
});

// ── Group Master Keys (for decrypting group state) ───────
export const groupMasterKeys = sqliteTable("group_master_keys", {
    groupId: text("group_id").primaryKey(),
    masterKey: text("master_key").notNull(),    // 32-byte GroupMasterKey (ENCRYPTED at rest)
    createdAt: integer("created_at", {mode: "timestamp"}),
});

// ── Server Public Params (for verifying credentials) ─────
export const serverParams = sqliteTable("server_params", {
    id: integer("id").primaryKey().default(1),
    publicParams: text("public_params").notNull(),  // ServerPublicParams (base64)
    fetchedAt: integer("fetched_at", {mode: "timestamp"}),
});

// ── My Profile Key ───────────────────────────────────────
export const myProfileKey = sqliteTable("my_profile_key", {
    id: integer("id").primaryKey().default(1),
    profileKey: text("profile_key").notNull(),       // 32-byte ProfileKey (ENCRYPTED at rest)
    profileKeyVersion: text("profile_key_version").notNull(),
    updatedAt: integer("updated_at", {mode: "timestamp"}),
});
```

### Mobile Database Initialization

```typescript
// apps/mobile/lib/db/index.ts
import {drizzle} from "drizzle-orm/expo-sqlite";
import {openDatabaseSync} from "expo-sqlite";
import * as schema from "./schema";

const expoDb = openDatabaseSync("signal_keys.db", {
    enableChangeListener: true,   // For useLiveQuery reactive queries
});

export const localDb = drizzle(expoDb, {schema});
```

### Running Migrations on App Start

```typescript
// apps/mobile/app/_layout.tsx  (or your root layout)
import {drizzle} from "drizzle-orm/expo-sqlite";
import {openDatabaseSync} from "expo-sqlite";
import {useMigrations} from "drizzle-orm/expo-sqlite/migrator";
import migrations from "../drizzle/migrations";

const expoDb = openDatabaseSync("signal_keys.db");
const db = drizzle(expoDb);

export default function RootLayout() {
    const {success, error} = useMigrations(db, migrations);

    if (error) return <Text>Migration
    error: {
        error.message
    }
    </Text>;
    if (!success) return <Text>Migrating
    local
    database
...
    </Text>;

    return <Slot / >;  // Your app renders after migrations complete
}
```

### Generate Mobile Migrations

```bash
cd apps/mobile
npx drizzle-kit generate
# This creates ./drizzle/migrations.js that gets bundled into the app
```

---

## 10. Client-Side Crypto & Key Storage

**CRITICAL:** Private keys NEVER leave the client device. They must be stored in
the most secure storage available on each platform.

### Web (Next.js) — IndexedDB + Web Crypto API

```
Storage: IndexedDB (encrypted with a key derived from user password via PBKDF2)
  └── identity_store
  │   ├── identityKeyPair          (Curve25519 private + public)
  │   ├── registrationId           (uint32)
  │   └── signedPreKeyPair         (Curve25519 private + public)
  ├── prekey_store
  │   └── [keyId] → preKeyPair     (Curve25519 private + public)
  ├── session_store
  │   └── [address] → sessionState (Double Ratchet state)
  ├── sender_key_store
  │   └── [groupId:address] → senderKeyState
  └── signed_prekey_store
      └── [keyId] → signedPreKeyPair

Encryption at rest:
  masterKey = PBKDF2(userPassword, salt, 100000, 256)
  wrappedData = AES-256-GCM(masterKey, iv, serializedStore)
```

### Mobile (Expo/React Native) — expo-secure-store + react-native-quick-crypto + SQLCipher

All cryptographic operations on mobile run through `react-native-quick-crypto`, a C++ JSI
native implementation of Node.js's `crypto` module. This is NOT a JS polyfill — it
executes directly on the native thread via Nitro Modules, bypassing the JS bridge entirely.
This gives you native-speed AES, HMAC, HKDF, random bytes, sign/verify, and more.

**Official docs:** https://margelo.github.io/react-native-quick-crypto/

```
Storage: expo-secure-store for master key, react-native-quick-crypto for all crypto ops

expo-secure-store (Keychain on iOS / Keystore on Android):
  └── master_encryption_key        (256-bit AES key)

react-native-quick-crypto provides (Node.js crypto API):
  ├── randomBytes(n)               → CSPRNG for all key generation
  ├── createCipheriv / createDecipheriv  → AES-256-CBC / AES-256-GCM
  ├── createHmac('sha256', key)    → HMAC-SHA256 for KDF chains
  ├── createHash('sha256')         → SHA-256 hashing
  ├── createSign / createVerify    → Ed25519 / ECDSA signatures
  ├── createPrivateKey / createPublicKey → Key object management
  ├── pbkdf2 / pbkdf2Sync         → Password-based key derivation
  └── hkdf / hkdfSync             → HKDF key expansion

SQLCipher database (encrypted with master key from expo-secure-store):
  └── identity_keys table
  ├── prekeys table
  ├── signed_prekeys table
  ├── sessions table
  └── sender_keys table
```

**Expo Setup for react-native-quick-crypto:**

```bash
# Install the package
expo install react-native-quick-crypto

# REQUIRED: Generate native code (not compatible with Expo Go!)
expo prebuild
```

**Early initialization (in your app's entry point, e.g., index.js):**

```typescript
// This MUST be the very first import in your app entry point
import {install} from 'react-native-quick-crypto';

install();  // Overrides global.Buffer and global.crypto
```

**Metro config (metro.config.js) — resolve `crypto` to quick-crypto:**

```javascript
// metro.config.js
const {getDefaultConfig} = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

config.resolver.resolveRequest = (context, moduleName, platform) => {
    if (moduleName === 'crypto') {
        // Redirect all `import crypto` to react-native-quick-crypto
        return context.resolveRequest(
            context,
            'react-native-quick-crypto',
            platform,
        );
    }
    // Everything else uses standard Metro resolution
    return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
```

**Alternative: Babel module-resolver (if you prefer compile-time aliasing):**

```javascript
// babel.config.js
module.exports = function (api) {
    api.cache(true);
    return {
        presets: ['babel-preset-expo'],
        plugins: [
            [
                'module-resolver',
                {
                    alias: {
                        'crypto': 'react-native-quick-crypto',
                        'stream': 'readable-stream',
                        'buffer': 'react-native-quick-crypto',
                        // react-native-quick-crypto re-exports Buffer from
                        // @craftzdog/react-native-buffer (JSI-accelerated)
                    },
                },
            ],
        ],
    };
};
```

After changing metro.config.js or babel.config.js, restart with:

```bash
yarn start --reset-cache
```

**IMPORTANT:** react-native-quick-crypto requires a Custom Dev Client or EAS build.
It does NOT work with Expo Go because it contains native C++ code.

**react-native-quick-crypto API Coverage for Signal Protocol:**

| Signal Needs        | quick-crypto API                                                               | Status            |
|---------------------|--------------------------------------------------------------------------------|-------------------|
| Secure random bytes | `crypto.randomBytes(32)`                                                       | Supported         |
| AES-256-CBC encrypt | `crypto.createCipheriv('aes-256-cbc', key, iv)`                                | Supported         |
| AES-256-GCM encrypt | `crypto.createCipheriv('aes-256-gcm', key, iv)`                                | Supported         |
| HMAC-SHA256         | `crypto.createHmac('sha256', key).update(data).digest()`                       | Supported         |
| SHA-256 hash        | `crypto.createHash('sha256').update(data).digest()`                            | Supported         |
| HKDF                | `crypto.hkdfSync('sha256', ikm, salt, info, length)`                           | Supported         |
| PBKDF2              | `crypto.pbkdf2Sync(password, salt, iterations, keylen, 'sha256')`              | Supported         |
| Ed25519 sign        | `crypto.createSign('ed25519')` or `crypto.sign('ed25519', data, key)`          | Supported         |
| Ed25519 verify      | `crypto.createVerify('ed25519')` or `crypto.verify('ed25519', data, key, sig)` | Supported         |
| Key objects         | `crypto.createPrivateKey()` / `crypto.createPublicKey()`                       | Supported         |
| ECDH (x25519)       | Not yet supported — use `@noble/curves` for x25519 DH                          | Use @noble/curves |
| generateKeyPair     | `crypto.generateKeyPairSync('ed25519')`                                        | Supported         |

**Note on Curve25519 DH:** react-native-quick-crypto does not yet implement
`createECDH` or raw x25519 Diffie-Hellman. For the X3DH and Double Ratchet DH
operations, use `@noble/curves` which provides pure-JS x25519 and runs well
on both web and React Native. The `@noble/curves` library is audited and has
no native dependencies.

**Usage example for Signal primitives with react-native-quick-crypto:**

```typescript
import crypto from 'react-native-quick-crypto';
import {x25519} from '@noble/curves/ed25519';

// --- Random bytes (for key generation) ---
const chainKey = crypto.randomBytes(32);       // 32 random bytes
const iv = crypto.randomBytes(16);             // 16-byte IV for AES

// --- HMAC-SHA256 (for KDF chain ratcheting) ---
const messageKey = crypto.createHmac('sha256', chainKey)
    .update(Buffer.from([0x01]))
    .digest();

const nextChainKey = crypto.createHmac('sha256', chainKey)
    .update(Buffer.from([0x02]))
    .digest();

// --- AES-256-CBC (for message encryption) ---
const cipher = crypto.createCipheriv('aes-256-cbc', messageKey, iv);
let encrypted = cipher.update(plaintext, 'utf8', 'base64');
encrypted += cipher.final('base64');

const decipher = crypto.createDecipheriv('aes-256-cbc', messageKey, iv);
let decrypted = decipher.update(encrypted, 'base64', 'utf8');
decrypted += decipher.final('utf8');

// --- HKDF (for deriving multiple keys from shared secret) ---
const derivedKey = crypto.hkdfSync(
    'sha256',
    sharedSecret,            // input keying material
    Buffer.alloc(32, 0),     // salt (32 zero bytes for Signal)
    'WhisperText',           // info string
    64                       // output length: 32 bytes root key + 32 bytes chain key
);

// --- Ed25519 Signatures (for Sender Key message authentication) ---
const {publicKey, privateKey} = crypto.generateKeyPairSync('ed25519');
const signature = crypto.sign(null, ciphertext, privateKey);
const isValid = crypto.verify(null, ciphertext, publicKey, signature);

// --- X25519 DH (via @noble/curves, for X3DH and Double Ratchet) ---
const alicePrivate = x25519.utils.randomPrivateKey();  // uses crypto.getRandomValues
const alicePublic = x25519.getPublicKey(alicePrivate);
const sharedSecret = x25519.getSharedSecret(alicePrivate, bobPublicKey);
```

---

## 11. Project Structure

```
monorepo/
├── packages/
│   └── crypto/                         # Shared Signal Protocol implementation
│       ├── src/
│       │   ├── primitives/             # CryptoProvider interface + @noble/curves
│       │   ├── protocol/              # X3DH, DoubleRatchet, GroupCipher, SenderKey
│       │   ├── zkgroup/               # Zero-Knowledge Groups V2 (portable, @noble/curves)
│       │   │   ├── GroupMasterKey.ts        # 32-byte key + derivation to GroupSecretParams
│       │   │   ├── GroupSecretParams.ts     # UID/ProfileKey/Blob encrypt+decrypt
│       │   │   ├── UidCiphertext.ts         # Deterministic Elgamal encryption of UUID
│       │   │   ├── ProfileKeyCiphertext.ts  # Elgamal encryption of ProfileKey
│       │   │   ├── AuthCredentialPresentation.ts  # ZK proof of membership
│       │   │   ├── ProfileKeyCredentialPresentation.ts
│       │   │   ├── ClientZkOperations.ts    # Client-side credential + presentation logic
│       │   │   └── Ristretto255.ts          # Algebraic MAC + Schnorr proofs over Ristretto
│       │   └── stores/                # Store interfaces (platform-agnostic)
│       └── package.json
│
├── apps/
│   ├── web/                            # Next.js 16+
│   │   ├── app/
│   │   │   ├── api/
│   │   │   │   ├── auth/[...all]/route.ts          # Better Auth handler
│   │   │   │   ├── encryption/
│   │   │   │   │   ├── register-device/route.ts
│   │   │   │   │   ├── prekey-bundle/[userId]/route.ts
│   │   │   │   │   └── send-message/route.ts
│   │   │   │   └── groups/                          # Groups V2 ZK endpoints
│   │   │   │       ├── credentials/
│   │   │   │       │   ├── auth/route.ts            # Issue AuthCredentials (needs session)
│   │   │   │       │   └── profile-key/route.ts     # Issue ProfileKeyCredentials (blinded)
│   │   │   │       ├── [groupId]/route.ts           # GET (fetch) + PATCH (modify) group
│   │   │   │       ├── [groupId]/logs/[fromVersion]/route.ts  # Change log
│   │   │   │       └── route.ts                     # PUT (create group)
│   │   │   ├── (auth)/
│   │   │   │   ├── sign-in/page.tsx
│   │   │   │   └── sign-up/page.tsx
│   │   │   └── (app)/
│   │   │       ├── chat/[id]/page.tsx
│   │   │       └── groups/page.tsx
│   │   ├── lib/
│   │   │   ├── auth.ts                             # Better Auth server config
│   │   │   ├── auth-client.ts                      # Better Auth client
│   │   │   ├── zkgroup/                            # Server-side ZK operations
│   │   │   │   ├── server-params.ts                # Load/cache ServerSecretParams
│   │   │   │   ├── credential-issuer.ts            # Issue Auth + ProfileKey credentials
│   │   │   │   └── presentation-verifier.ts        # Verify ZK presentations on group endpoints
│   │   │   └── db/
│   │   │       ├── index.ts                        # Drizzle + postgres-js connection
│   │   │       └── schema/
│   │   │           ├── auth-schema.ts              # Better Auth tables (generated)
│   │   │           ├── encryption-schema.ts        # Encryption + ZK group tables
│   │   │           └── index.ts                    # Barrel export
│   │   ├── proxy.ts                                # Next.js 16 auth protection
│   │   ├── drizzle.config.ts                       # Drizzle Kit for Supabase
│   │   └── supabase/migrations/                    # Generated SQL migrations
│   │
│   └── mobile/                         # Expo 55+
│       ├── app/
│       │   ├── _layout.tsx                         # Root: migrations + auth check
│       │   ├── (auth)/
│       │   │   ├── sign-in.tsx
│       │   │   └── sign-up.tsx
│       │   └── (app)/
│       │       ├── chat/[id].tsx
│       │       └── groups.tsx
│       ├── lib/
│       │   ├── auth-client.ts                      # Better Auth Expo client
│       │   ├── api.ts                              # Authenticated fetch wrapper
│       │   ├── db/
│       │   │   ├── index.ts                        # Drizzle + expo-sqlite connection
│       │   │   └── schema.ts                       # SQLite schema (keys + credentials)
│       │   ├── crypto/
│       │   │   └── NativeCryptoProvider.ts          # react-native-quick-crypto
│       │   ├── zkgroup/                            # Client-side ZK operations
│       │   │   ├── credential-manager.ts           # Fetch + cache credentials from server
│       │   │   ├── group-operations.ts             # Create/fetch/modify groups via ZK
│       │   │   └── presentation-builder.ts         # Build AuthCredentialPresentations
│       │   ├── stores/                             # Signal store implementations (SQLite-backed)
│       │   │   ├── SqliteIdentityStore.ts
│       │   │   ├── SqlitePreKeyStore.ts
│       │   │   ├── SqliteSessionStore.ts
│       │   │   ├── SqliteSenderKeyStore.ts
│       │   │   └── SqliteCredentialStore.ts        # Auth + ProfileKey credentials
│       │   └── encryption/
│       │       ├── MessageEncryptor.ts
│       │       └── MessageDecryptor.ts
│       ├── drizzle/                                # Generated SQLite migrations
│       │   └── migrations.js
│       ├── drizzle.config.ts                       # Drizzle Kit for Expo SQLite
│       ├── babel.config.js                         # inline-import + module-resolver
│       ├── metro.config.js                         # .sql ext + crypto resolve
│       └── index.js                                # install() for quick-crypto
```

---

## 12. Store Interfaces (Platform-Agnostic)

### Store Interfaces (Platform-Agnostic)

```typescript
// packages/crypto/src/stores/types.ts

interface IdentityKeyStore {
    getIdentityKeyPair(): Promise<KeyPair>;

    getLocalRegistrationId(): Promise<number>;

    saveIdentity(address: ProtocolAddress, identityKey: PublicKey): Promise<boolean>;

    isTrustedIdentity(address: ProtocolAddress, identityKey: PublicKey): Promise<boolean>;
}

interface PreKeyStore {
    loadPreKey(preKeyId: number): Promise<PreKeyRecord>;

    storePreKey(preKeyId: number, record: PreKeyRecord): Promise<void>;

    removePreKey(preKeyId: number): Promise<void>;

    getAvailablePreKeyCount(): Promise<number>;
}

interface SignedPreKeyStore {
    loadSignedPreKey(signedPreKeyId: number): Promise<SignedPreKeyRecord>;

    storeSignedPreKey(signedPreKeyId: number, record: SignedPreKeyRecord): Promise<void>;
}

interface SessionStore {
    loadSession(address: ProtocolAddress): Promise<SessionRecord | null>;

    storeSession(address: ProtocolAddress, record: SessionRecord): Promise<void>;

    getSubDeviceSessions(name: string): Promise<number[]>;
}

interface SenderKeyStore {
    storeSenderKey(
        sender: ProtocolAddress,
        distributionId: string,     // UUID identifying this sender key
        record: SenderKeyRecord
    ): Promise<void>;

    loadSenderKey(
        sender: ProtocolAddress,
        distributionId: string
    ): Promise<SenderKeyRecord | null>;
}

// Address identifies a specific device of a specific user
interface ProtocolAddress {
    name: string;      // user UUID
    deviceId: number;  // device number
}
```

## 13. Sender Key Distribution Flow

This is the complete flow for distributing a Sender Key to all group members.

```
 Alice (sender)              Server              Bob's Device    Carol's Device
 ─────────────              ──────              ────────────    ──────────────
      │                        │                      │               │
      │  1. Generate SenderKey │                      │               │
      │     for group G        │                      │               │
      │                        │                      │               │
      │  2. For Bob:           │                      │               │
      │     Encrypt SenderKey  │                      │               │
      │     with Alice↔Bob     │                      │               │
      │     Double Ratchet     │                      │               │
      │     session            │                      │               │
      │  ─────────────────────>│                      │               │
      │  (SenderKeyDistribution│                      │               │
      │   Message, 1:1 encrypted)                     │               │
      │                        │  3. Deliver to Bob   │               │
      │                        │─────────────────────>│               │
      │                        │                      │               │
      │  4. For Carol:         │                      │  5. Bob decrypts│
      │     Encrypt SenderKey  │                      │  with his end  │
      │     with Alice↔Carol   │                      │  of the Alice  │
      │     Double Ratchet     │                      │  ↔Bob session  │
      │     session            │                      │                │
      │  ─────────────────────>│                      │  6. Bob stores │
      │                        │                      │  Alice's Sender│
      │                        │  7. Deliver to Carol │  Key for group │
      │                        │─────────────────────>│──────>│        │
      │                        │                      │       │        │
      │  NOW Alice can send    │                      │  8. Carol does │
      │  group messages        │                      │  the same      │
      │                        │                      │               │
      │  9. Send group msg     │                      │               │
      │  (encrypted ONCE with  │                      │               │
      │   Alice's Sender Key)  │                      │               │
      │  ─────────────────────>│                      │               │
      │                        │  10. Fan out same    │               │
      │                        │  ciphertext to all   │               │
      │                        │─────────────────────>│               │
      │                        │─────────────────────────────────────>│
      │                        │                      │               │
      │                        │                Bob decrypts    Carol decrypts
      │                        │                with Alice's    with Alice's
      │                        │                Sender Key      Sender Key
```

### When Sender Keys Must Be Re-distributed

A Sender Key for a group MUST be regenerated and redistributed when:

1. **A member is removed** — ALL members generate new Sender Keys (the removed member
   had everyone's old keys)
2. **A member's device is removed** — Same as above for that member
3. **Periodically** — Signal re-distributes after a configurable number of messages
   or time period for additional forward secrecy
4. **On first message to a group** — If no Sender Key exists yet for this group

A Sender Key does NOT need rotation when:

- A new member is added (they simply receive existing Sender Keys from each member)
- A message is sent/received normally

---

## 14. Group Message Send/Receive Flow

### Sending a Group Message (Complete)

```typescript
async function sendGroupMessage(groupId: string, plaintext: string) {
    // 1. Get all member devices for this group
    const memberDevices = await fetchGroupMemberDevices(groupId);

    // 2. Check if we have a Sender Key for this group
    let senderKeyState = await senderKeyStore.loadSenderKey(
        myAddress, groupId
    );

    // 3. If no Sender Key exists, generate and distribute
    if (!senderKeyState) {
        senderKeyState = generateNewSenderKey();

        // Distribute to each member's device via their 1:1 session
        for (const device of memberDevices) {
            if (device.id === myDevice.id) continue; // skip self

            // Encrypt SenderKeyDistributionMessage with 1:1 session
            const session = await sessionStore.loadSession(device.address);
            if (!session) {
                // Need to establish session first — fetch prekey bundle
                const bundle = await fetchPreKeyBundle(device);
                await sessionBuilder.processPreKeyBundle(bundle);
            }

            const distributionMessage = createSenderKeyDistribution(senderKeyState);
            const encrypted = await sessionCipher.encrypt(
                device.address,
                distributionMessage.serialize()
            );

            await sendToServer({
                type: 'sender_key_distribution',
                recipientDeviceId: device.id,
                ciphertext: encrypted,
                groupId: groupId
            });
        }

        await senderKeyStore.storeSenderKey(myAddress, groupId, senderKeyState);
    }

    // 4. Encrypt group message with Sender Key (ONE encryption for ALL recipients)
    const groupCiphertext = await groupCipher.encrypt(
        groupId,
        Buffer.from(plaintext, 'utf-8')
    );

    // 5. Send single ciphertext to server
    await sendToServer({
        type: 'sender_key_message',
        groupId: groupId,
        ciphertext: groupCiphertext,
        senderKeyId: senderKeyState.keyId
    });
}
```

### Receiving a Group Message (Complete)

```typescript
// Listen via Supabase Realtime
supabase
    .channel('messages')
    .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `group_id=in.(${myGroupIds.join(',')})`,
    }, async (payload) => {
        const message = payload.new;

        if (message.message_type === 'sender_key_distribution') {
            // This is a Sender Key being shared with us
            await handleSenderKeyDistribution(message);
        } else if (message.message_type === 'sender_key_message') {
            // This is an encrypted group message
            await handleGroupMessage(message);
        }
    })
    .subscribe();

async function handleSenderKeyDistribution(message) {
    // 1. Decrypt the distribution message using 1:1 session with sender
    const senderAddress = {
        name: message.sender_user_id,
        deviceId: message.sender_device_id
    };

    const decrypted = await sessionCipher.decrypt(
        senderAddress,
        message.ciphertext
    );

    // 2. Parse the SenderKeyDistributionMessage
    const distribution = SenderKeyDistributionMessage.deserialize(decrypted);

    // 3. Store the sender's key for this group
    await senderKeyStore.storeSenderKey(
        senderAddress,
        message.group_id,
        {
            chainKey: distribution.chainKey,
            signaturePublicKey: distribution.signingKey,
            senderKeyId: distribution.id,
            iteration: distribution.iteration
        }
    );
}

async function handleGroupMessage(message) {
    const senderAddress = {
        name: message.sender_user_id,
        deviceId: message.sender_device_id
    };

    // 1. Look up sender's Sender Key for this group
    const senderKey = await senderKeyStore.loadSenderKey(
        senderAddress,
        message.group_id
    );

    if (!senderKey) {
        // We don't have this sender's key yet
        // Request re-distribution (send a request message to the sender)
        await requestSenderKeyDistribution(senderAddress, message.group_id);
        // Queue message for later decryption
        await queueMessage(message);
        return;
    }

    // 2. Decrypt with GroupCipher
    const plaintext = await groupCipher.decrypt(
        senderAddress,
        message.group_id,
        message.ciphertext
    );

    // 3. Display message
    displayMessage(message.group_id, senderAddress, plaintext.toString('utf-8'));
}
```

---

## 15. Member Add/Remove & Key Rotation

### Adding a Member (Full Groups V2 + Sender Key Distribution)

```
1. Admin (Alice) decides to add Eve to group "Engineers"

2. GROUP STATE UPDATE (via ZK anonymous credentials):
   a. Alice computes Eve's uidCiphertext using GroupSecretParams
   b. Alice creates ProfileKeyCredentialPresentation for Eve's (UID, ProfileKey)
   c. Alice creates her own AuthCredentialPresentation (ZK proof she's an admin)
   d. Alice sends PATCH /groups/{groupId} with GroupChange:
      { addMembers: [{ uidCiphertext, profileKeyCiphertext, role: MEMBER }] }
   e. Server verifies Alice's admin presentation, applies change, bumps version
   f. Server has NO idea who "Eve" is — only sees encrypted ciphertext added

3. KEY DISTRIBUTION (via 1:1 E2E channels):
   a. Alice sends GroupMasterKey to Eve via Alice↔Eve encrypted session
   b. Eve derives GroupSecretParams, fetches + decrypts group state
   c. Each EXISTING member distributes their Sender Key to Eve:
      - Alice sends her Sender Key to Eve (via Alice↔Eve 1:1 session)
      - Bob sends his Sender Key to Eve (via Bob↔Eve 1:1 session)
      - Carol sends her Sender Key to Eve (via Carol↔Eve 1:1 session)
   d. Eve generates her own Sender Key and distributes to all members

4. Eve can now send and receive group messages

NOTE: Eve CANNOT decrypt messages sent before she joined, because
she didn't have the Sender Keys that were active then.
```

### Removing a Member (Full Groups V2 + Sender Key Rotation)

```
1. Admin (Alice) decides to remove Eve from group "Engineers"

2. GROUP STATE UPDATE (via ZK anonymous credentials):
   a. Alice computes Eve's uidCiphertext (deterministic from GroupSecretParams + UUID)
   b. Alice creates her AuthCredentialPresentation (ZK proof she's an admin)
   c. Alice sends PATCH /groups/{groupId} with GroupChange:
      { removeMembers: [eveUidCiphertext] }
   d. Server verifies Alice's admin presentation, removes the entry, bumps version
   e. Server has NO idea who was removed — only sees a ciphertext entry deleted

3. SENDER KEY ROTATION (critical for forward secrecy):
   ALL remaining members MUST:
   a. Delete their current Sender Key for this group
   b. Generate a NEW Sender Key
   c. Distribute the new Sender Key to all REMAINING members
      (via 1:1 sessions — Eve does NOT receive these)
   d. This happens automatically when members detect the version bump

4. Eve's client detects it has been removed (version bump, her entry gone)
   Eve CANNOT decrypt any messages sent after her removal.

NOTE: Eve retains the GroupMasterKey and old Sender Keys, so she
could theoretically collude with a compromised server to re-read
old ciphertexts. This is a known limitation acknowledged in the paper.
But she cannot decrypt NEW messages because she lacks the new Sender Keys.
```

### Forced Key Rotation (Additional Forward Secrecy)

```
Periodically (e.g., every 24 hours or every N messages):
  1. Each member generates a new Sender Key
  2. Distributes to all other members
  3. Deletes old Sender Key state

This limits the window of exposure if a Sender Key is compromised.

Additionally, AuthCredentials have a limited validity window (e.g., 7 days).
Clients must periodically fetch fresh AuthCredentials from the server.
```

---

## 16. Multi-Device Support

Each device is treated as a SEPARATE entity with its own:

- Identity Key Pair
- Session state with every other device
- Sender Key per group

### Sending to a Multi-Device User

When Alice sends a group message, her Sender Key must be distributed to ALL of Bob's
devices (phone + laptop + tablet), because each device decrypts independently.

```
Alice's Phone → sends SenderKeyDistribution to:
  ├── Bob's Phone    (via Alice.phone ↔ Bob.phone session)
  ├── Bob's Laptop   (via Alice.phone ↔ Bob.laptop session)
  ├── Carol's Phone  (via Alice.phone ↔ Carol.phone session)
  └── Carol's Tablet (via Alice.phone ↔ Carol.tablet session)
```

### Syncing Messages Across Own Devices

When Alice sends from her phone, her laptop also needs to see the message.
Signal solves this by having the sender encrypt the message to their own other devices:

```
Alice sends "Hello" from Phone:
  1. Encrypt with Sender Key for group (sent to all members)
  2. ALSO encrypt plaintext for Alice's Laptop via Alice.phone ↔ Alice.laptop session
  3. Alice's Laptop receives and stores the message locally
```

---

## 17. API Routes (Next.js Server)

All encryption API routes authenticate via Better Auth automatically.

```typescript
// apps/web/app/api/encryption/register-device/route.ts
import {auth} from "@/lib/auth";
import {headers} from "next/headers";
import {db} from "@/lib/db";
import {devices, signedPrekeys, oneTimePrekeys} from "@/lib/db/schema";

export async function POST(request: Request) {
    const session = await auth.api.getSession({headers: await headers()});
    if (!session) return Response.json({error: "Unauthorized"}, {status: 401});

    const body = await request.json();

    // Insert device with user's Better Auth ID
    const [device] = await db.insert(devices).values({
        userId: session.user.id,
        deviceId: body.deviceId,
        registrationId: body.registrationId,
        identityKeyPublic: body.identityKeyPublic,
        platform: body.platform,
    }).returning();

    // Insert signed prekey
    await db.insert(signedPrekeys).values({
        deviceId: device.id,
        keyId: body.signedPreKey.keyId,
        publicKey: body.signedPreKey.publicKey,
        signature: body.signedPreKey.signature,
    });

    // Insert one-time prekeys (batch)
    await db.insert(oneTimePrekeys).values(
        body.oneTimePreKeys.map((pk: any) => ({
            deviceId: device.id,
            keyId: pk.keyId,
            publicKey: pk.publicKey,
        }))
    );

    return Response.json({deviceId: device.id});
}
```

```typescript
// apps/web/app/api/encryption/prekey-bundle/[userId]/route.ts
import {auth} from "@/lib/auth";
import {headers} from "next/headers";
import {db} from "@/lib/db";
import {devices, signedPrekeys, oneTimePrekeys} from "@/lib/db/schema";
import {eq, and} from "drizzle-orm";

export async function GET(
    request: Request,
    {params}: { params: Promise<{ userId: string }> }
) {
    const session = await auth.api.getSession({headers: await headers()});
    if (!session) return Response.json({error: "Unauthorized"}, {status: 401});

    const {userId} = await params;

    // Get all active devices for the target user
    const userDevices = await db.query.devices.findMany({
        where: and(eq(devices.userId, userId), eq(devices.isActive, true)),
        with: {
            signedPrekeys: true,
        },
    });

    // For each device, pick one unused one-time prekey
    const bundles = await Promise.all(userDevices.map(async (device) => {
        const [otp] = await db.select()
            .from(oneTimePrekeys)
            .where(and(eq(oneTimePrekeys.deviceId, device.id), eq(oneTimePrekeys.used, false)))
            .limit(1);

        // Mark it as used
        if (otp) {
            await db.update(oneTimePrekeys)
                .set({used: true})
                .where(eq(oneTimePrekeys.id, otp.id));
        }

        return {
            deviceId: device.deviceId,
            registrationId: device.registrationId,
            identityKey: device.identityKeyPublic,
            signedPreKey: device.signedPrekeys[0],
            oneTimePreKey: otp ?? null,
        };
    }));

    return Response.json({bundles});
}
```

---

### Making Authenticated Requests from Expo

Better Auth stores cookies in SecureStore on Expo. You must attach them manually:

```typescript
// apps/mobile/lib/api.ts
import {authClient} from "./auth-client";

export async function encryptionApi(path: string, options: RequestInit = {}) {
    const cookies = authClient.getCookie();
    return fetch(`${process.env.EXPO_PUBLIC_API_URL}${path}`, {
        ...options,
        credentials: "omit",   // Don't let fetch manage cookies
        headers: {
            ...options.headers,
            "Content-Type": "application/json",
            "Cookie": cookies ?? "",  // Attach Better Auth session cookie
        },
    });
}

// Usage:
const res = await encryptionApi("/api/encryption/prekey-bundle/usr_abc123");
const {bundles} = await res.json();
```

---

## 18. Auth-to-Encryption Complete Flow

The flow from "user logs in" to "user sends encrypted group message":

```
1. USER SIGNS UP / SIGNS IN (Better Auth)
   ├── Better Auth creates `user` row in Supabase  (id = "usr_abc123")
   ├── Better Auth creates `session` row
   └── Client receives session cookie / token

2. DEVICE REGISTRATION (on first launch after auth)
   ├── Client generates identity key pair locally
   ├── Client generates signed prekey + 100 one-time prekeys
   ├── Client stores PRIVATE keys in local SQLite (Drizzle Expo)
   ├── Client uploads PUBLIC keys to server:
   │   POST /api/encryption/register-device
   │   Auth: Better Auth session cookie (auto-attached)
   │   Body: { identityKeyPublic, signedPrekey, oneTimePrekeys }
   └── Server stores in Supabase (Drizzle Postgres):
       INSERT INTO devices (user_id = session.user.id, ...)
       INSERT INTO signed_prekeys (...)
       INSERT INTO one_time_prekeys (...)

3. ZK CREDENTIAL PROVISIONING (daily, after auth)
   ├── Client requests AuthCredentials:
   │   POST /api/groups/credentials/auth
   │   Auth: Better Auth session cookie
   │   Server: issues AuthCredentialWithPni for client's UID + today's date
   │   Server: uses ServerSecretParams from server_zk_params table
   ├── Client verifies credential using ServerPublicParams
   ├── Client stores credentials locally (valid ~7 days)
   ├── Client registers ProfileKeyCommitment if not yet done:
   │   POST /api/groups/credentials/profile-key-commitment
   │   Auth: Better Auth session cookie
   └── Client can now request ProfileKeyCredentials for contacts

4. SESSION ESTABLISHMENT (first message to a new contact)
   ├── Client fetches recipient's prekey bundle:
   │   GET /api/encryption/prekey-bundle/:userId
   │   Auth: Better Auth session cookie
   │   Server queries: devices + signed_prekeys + one_time_prekeys
   ├── Client performs X3DH locally
   ├── Client stores session in local SQLite
   └── Server deletes used one-time prekey from Supabase

5. GROUP CREATION (via ZK anonymous credentials)
   ├── Client generates GroupMasterKey, derives GroupSecretParams
   ├── Client encrypts all member UIDs + ProfileKeys with GroupSecretParams
   ├── Client creates AuthCredentialPresentation (ZK proof of membership)
   ├── Client sends PUT /api/groups/{groupId}
   │   Auth: AuthCredentialPresentation (NOT session cookie!)
   │   Body: encrypted group state + credential proofs
   ├── Server verifies ZK proofs, stores ONLY encrypted entries
   └── Client sends GroupMasterKey to each member via 1:1 E2E

6. GROUP MESSAGE SENDING
   ├── Client checks: do I have a Sender Key for this group?
   │   SELECT FROM sender_keys WHERE composite_key = groupId:myAddress (SQLite)
   ├── If no: generate + distribute via 1:1 sessions
   │   Track distribution: INSERT INTO sender_key_distributions (Supabase)
   ├── Encrypt message ONCE with Sender Key (local crypto)
   ├── Send ciphertext to server:
   │   POST /api/messages/send-group
   │   Auth: AuthCredentialPresentation for group membership verification
   │   Server: INSERT INTO messages (Supabase)
   └── Server fans out via Supabase Realtime

7. GROUP MESSAGE RECEIVING
   ├── Supabase Realtime delivers message to client
   ├── Client looks up sender's Sender Key:
   │   SELECT FROM sender_keys WHERE composite_key (SQLite)
   ├── Decrypt locally
   ├── Store plaintext in local cache:
   │   INSERT INTO local_messages (SQLite)
   └── Display to user
```

---

## 19. Library & Technology Choices

### For Your Stack (Next.js + Expo + Supabase)

**Cryptographic Primitives:**

| Primitive              | Web (Next.js)                    | Mobile (Expo)                                                             |
|------------------------|----------------------------------|---------------------------------------------------------------------------|
| Curve25519 DH (x25519) | `@noble/curves` (x25519)         | `@noble/curves` (x25519) — quick-crypto lacks ECDH                        |
| Ed25519 Signatures     | `@noble/curves` (ed25519)        | `react-native-quick-crypto` (`crypto.sign('ed25519')`) or `@noble/curves` |
| AES-256-CBC/GCM        | Web Crypto API (`crypto.subtle`) | `react-native-quick-crypto` (`crypto.createCipheriv`)                     |
| HMAC-SHA256            | Web Crypto API                   | `react-native-quick-crypto` (`crypto.createHmac`)                         |
| HKDF                   | Web Crypto API                   | `react-native-quick-crypto` (`crypto.hkdfSync`)                           |
| SHA-256                | Web Crypto API                   | `react-native-quick-crypto` (`crypto.createHash`)                         |
| PBKDF2                 | Web Crypto API                   | `react-native-quick-crypto` (`crypto.pbkdf2Sync`)                         |
| Secure Random          | `crypto.getRandomValues()`       | `react-native-quick-crypto` (`crypto.randomBytes()`)                      |
| Key Storage            | IndexedDB + Web Crypto wrapping  | `expo-secure-store` (master key) + SQLCipher (bulk)                       |

**Protocol Implementation Options:**

| Option                | Package                                          | Notes                                                                                                                            |
|-----------------------|--------------------------------------------------|----------------------------------------------------------------------------------------------------------------------------------|
| Official (Rust+NAPI)  | `@signalapp/libsignal-client`                    | Full protocol, native binaries, Node.js only (NOT browser). Good for a Next.js server-side component, NOT for client-side web.   |
| TypeScript (Pure JS)  | `@privacyresearch/libsignal-protocol-typescript` | Pure TS port, works in browser + React Native. Covers X3DH + Double Ratchet. You'll need to implement Sender Key layer yourself. |
| Build from primitives | `@noble/curves` + `@noble/hashes`                | Maximum control, auditable, no native dependencies. Recommended if you want to truly understand every byte.                      |

**Recommended Approach:**

For a cross-platform app that must run in both a web browser AND React Native,
the best path is:

1. Use `@noble/curves` + `@noble/hashes` for all cryptographic primitives
   (pure JS, audited, no native deps, works everywhere)
2. Implement the Signal Protocol yourself using these primitives, following the
   specifications exactly
3. Use `@signalapp/libsignal-client` ONLY on your server-side if you need it
   for any server-assisted operations

### NPM Packages

```json
// Shared crypto package (used by both web and mobile)
{
  "dependencies": {
    "@noble/curves": "^1.4.0",
    // x25519 DH + Ed25519 (works everywhere)
    "@noble/hashes": "^1.4.0",
    // SHA-256, HMAC, HKDF (works everywhere)
    "@noble/ciphers": "^0.5.0",
    // AES-256-CBC/GCM (works everywhere)
    "@supabase/supabase-js": "^2.x",
    "protobufjs": "^7.x"
    // For Signal protocol message serialization
  }
}

// For Expo mobile app:
{
  "dependencies": {
    "react-native-quick-crypto": "^1.0.0",
    // C++ JSI native crypto (Node.js API)
    "readable-stream": "^4.x",
    // Stream polyfill (quick-crypto dependency)
    "expo-secure-store": "~13.x"
    // Keychain/Keystore for master key ONLY
  }
}
// NOTE: Do NOT install expo-crypto — react-native-quick-crypto replaces it entirely
// NOTE: Minimum React Native version for quick-crypto v1.x is 0.75
// NOTE: Requires `expo prebuild` — does NOT work with Expo Go
```

**Why both @noble/* AND react-native-quick-crypto?**

On mobile, react-native-quick-crypto handles AES, HMAC, HKDF, random bytes, and
Ed25519 signatures at native C++ speed. But it does not yet implement x25519
Diffie-Hellman (`createECDH` is not supported). Since x25519 DH is the core of
X3DH and the Double Ratchet's asymmetric ratchet, we use `@noble/curves` for that
operation on both platforms. This keeps the DH code platform-identical and auditable.

On web, the Web Crypto API handles most symmetric operations, and `@noble/curves`
handles x25519/Ed25519. The `@noble/*` libraries are pure JS with no native deps,
so they work identically in both environments.

**Your crypto provider abstraction should look like this:**

```typescript
// packages/crypto/src/primitives/CryptoProvider.ts

export interface CryptoProvider {
    // Random bytes — native on mobile, Web Crypto on web
    randomBytes(length: number): Uint8Array;

    // HMAC-SHA256 — native on mobile, Web Crypto on web
    hmacSha256(key: Uint8Array, data: Uint8Array): Promise<Uint8Array>;

    // HKDF — native on mobile, Web Crypto on web
    hkdf(ikm: Uint8Array, salt: Uint8Array, info: string, length: number): Promise<Uint8Array>;

    // AES-256-CBC — native on mobile, Web Crypto on web
    aesCbcEncrypt(key: Uint8Array, iv: Uint8Array, plaintext: Uint8Array): Promise<Uint8Array>;

    aesCbcDecrypt(key: Uint8Array, iv: Uint8Array, ciphertext: Uint8Array): Promise<Uint8Array>;

    // X25519 DH — @noble/curves on BOTH platforms
    x25519GenerateKeyPair(): { publicKey: Uint8Array; privateKey: Uint8Array };

    x25519SharedSecret(privateKey: Uint8Array, publicKey: Uint8Array): Uint8Array;

    // Ed25519 — native on mobile, @noble/curves on web
    ed25519Sign(privateKey: Uint8Array, message: Uint8Array): Uint8Array;

    ed25519Verify(publicKey: Uint8Array, message: Uint8Array, signature: Uint8Array): boolean;
}
```

```typescript
// apps/mobile/lib/crypto/NativeCryptoProvider.ts
import crypto from 'react-native-quick-crypto';
import {x25519} from '@noble/curves/ed25519';

export class NativeCryptoProvider implements CryptoProvider {
    randomBytes(length: number): Uint8Array {
        return new Uint8Array(crypto.randomBytes(length));
    }

    async hmacSha256(key: Uint8Array, data: Uint8Array): Promise<Uint8Array> {
        const hmac = crypto.createHmac('sha256', Buffer.from(key));
        hmac.update(Buffer.from(data));
        return new Uint8Array(hmac.digest());
    }

    async hkdf(ikm: Uint8Array, salt: Uint8Array, info: string, length: number): Promise<Uint8Array> {
        const derived = crypto.hkdfSync('sha256', ikm, salt, info, length);
        return new Uint8Array(derived);
    }

    async aesCbcEncrypt(key: Uint8Array, iv: Uint8Array, plaintext: Uint8Array): Promise<Uint8Array> {
        const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(key), Buffer.from(iv));
        const encrypted = Buffer.concat([cipher.update(Buffer.from(plaintext)), cipher.final()]);
        return new Uint8Array(encrypted);
    }

    async aesCbcDecrypt(key: Uint8Array, iv: Uint8Array, ciphertext: Uint8Array): Promise<Uint8Array> {
        const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(key), Buffer.from(iv));
        const decrypted = Buffer.concat([decipher.update(Buffer.from(ciphertext)), decipher.final()]);
        return new Uint8Array(decrypted);
    }

    // x25519 DH — uses @noble/curves (quick-crypto doesn't support ECDH yet)
    x25519GenerateKeyPair() {
        const privateKey = x25519.utils.randomPrivateKey();
        const publicKey = x25519.getPublicKey(privateKey);
        return {publicKey, privateKey};
    }

    x25519SharedSecret(privateKey: Uint8Array, publicKey: Uint8Array): Uint8Array {
        return x25519.getSharedSecret(privateKey, publicKey);
    }

    // Ed25519 — uses native quick-crypto for speed
    ed25519Sign(privateKey: Uint8Array, message: Uint8Array): Uint8Array {
        const keyObj = crypto.createPrivateKey({
            key: Buffer.from(privateKey),
            format: 'raw',
            type: 'pkcs8',
        });
        return new Uint8Array(crypto.sign(null, Buffer.from(message), keyObj));
    }

    ed25519Verify(publicKey: Uint8Array, message: Uint8Array, signature: Uint8Array): boolean {
        const keyObj = crypto.createPublicKey({
            key: Buffer.from(publicKey),
            format: 'raw',
            type: 'spki',
        });
        return crypto.verify(null, Buffer.from(message), keyObj, Buffer.from(signature));
    }
}
```

---

## 20. Security Considerations

### What You MUST Get Right

1. **Never store private keys on the server.** Only public keys go to the server.
   Private keys live only on the client device, encrypted at rest.

2. **Delete one-time prekeys after use.** Once a prekey is used for session
   establishment, it must be removed from the server immediately.

3. **Implement proper key rotation.**
    - Signed PreKeys: rotate every 7-30 days
    - Sender Keys: rotate on member removal, periodically
    - One-Time PreKeys: replenish when count drops below threshold (e.g., 25)

4. **Handle out-of-order messages.** Store skipped message keys (up to a limit)
   for messages that arrive out of order. Delete them after use or after a timeout.

5. **Verify identity keys.** Implement a safety number / QR code verification
   mechanism so users can confirm they're talking to the right person and not
   a MITM.

6. **Handle key changes.** When a user reinstalls or gets a new device, their
   identity key changes. You MUST notify other users of this change (like Signal's
   "safety number has changed" warning).

7. **Use constant-time comparisons.** For MAC verification and key comparison,
   always use constant-time comparison functions to prevent timing attacks.

8. **Rate-limit prekey fetching.** Prevent attackers from exhausting a user's
   one-time prekeys by rate-limiting prekey bundle requests.

9. **Validate all signatures.** Always verify the Signed PreKey signature during
   session establishment. Always verify Sender Key signatures on group messages.

10. **Implement message replay protection.** Track message counters to prevent
    replay attacks. Reject messages with counter values that have already been seen.

### What Signal Has That You'll Need to Consider

- **Sealed Sender:** Hides who sent a message from the server. Complex to implement
  but important for metadata privacy.
- **Certificate Transparency:** Detects if the server is issuing fake identity keys.
- **SGX Enclaves:** Server-side contact discovery without revealing contacts to server.
- **PIN-based Key Recovery (SVR):** Secure Value Recovery for backing up keys.

### Forward Secrecy Properties

| Scenario                            | 1:1 (Double Ratchet) | Group (Sender Keys)                          |
|-------------------------------------|----------------------|----------------------------------------------|
| Forward Secrecy (symmetric)         | Yes (KDF chain)      | Yes (KDF chain)                              |
| Post-Compromise Security            | Yes (DH ratchet)     | Partial (only on key rotation/member change) |
| Future Secrecy after member removal | N/A                  | Yes (full re-key)                            |
| Past message protection on join     | N/A                  | Yes (new member doesn't get old keys)        |

The key difference: 1:1 Double Ratchet achieves post-compromise security with EVERY
message exchange (because DH ratchet keys rotate with each message direction change).
Sender Keys only achieve this when the keys are rotated (member changes, periodic rotation).
This is a known and accepted tradeoff for the O(1) sending efficiency of Sender Keys.

---

## 21. NPM Dependencies (Complete)

```jsonc
// packages/crypto/package.json
{
  "dependencies": {
    "@noble/curves": "^1.4.0",     // Ristretto255 for ZK proofs + x25519 DH
    "@noble/hashes": "^1.4.0",
    "@noble/ciphers": "^0.5.0",
    "protobufjs": "^7.x"
  }
}

// apps/web/package.json (Next.js — SERVER)
{
  "dependencies": {
    "next": "^16.x",
    "react": "^19.x",
    "better-auth": "^1.x",
    "@better-auth/expo": "^1.x",
    "drizzle-orm": "^1.x",
    "postgres": "^3.x",
    "@supabase/supabase-js": "^2.x",
    // zkgroup — SERVER-SIDE credential issuance & verification (native Rust binaries)
    "@signalapp/libsignal-client": "^0.88.x"
    // Provides: ServerSecretParams, ServerZkAuthOperations, ServerZkProfileOperations,
    //           ServerZkGroupCipher, GroupSecretParams, AuthCredentialWithPni, etc.
    // from '@signalapp/libsignal-client/zkgroup'
    // NOTE: This is a native Node.js module (Rust via NAPI). It does NOT run in browser.
    // It runs on your Next.js server only (API routes, Server Actions, RSC).
  },
  "devDependencies": {
    "drizzle-kit": "^1.x",
    "@better-auth/cli": "^1.x"
  }
}

// apps/mobile/package.json (Expo)
{
  "dependencies": {
    "expo": "~55.x",
    "expo-sqlite": "~15.x",
    "expo-secure-store": "~14.x",
    "expo-network": "~7.x",
    "react-native-quick-crypto": "^1.0.0",
    "readable-stream": "^4.x",
    "better-auth": "^1.x",
    "@better-auth/expo": "^1.x",
    "drizzle-orm": "^1.x",
    "@supabase/supabase-js": "^2.x"
    // NOTE: @signalapp/libsignal-client does NOT run on React Native.
    // Client-side zkgroup operations (encrypt UID, create presentation, decrypt
    // group state) must use a portable TypeScript implementation built on
    // @noble/curves (Ristretto255) from the shared crypto package.
  },
  "devDependencies": {
    "drizzle-kit": "^1.x",
    "babel-plugin-inline-import": "^3.x",
    "babel-plugin-module-resolver": "^5.x"
  }
}
```

---

## 22. Implementation Roadmap

### Phase 1: Foundations (Weeks 1-3)

- [ ] Implement cryptographic primitives wrapper using @noble/*
- [ ] Implement key generation (identity, prekey, signed prekey)
- [ ] Build server-side prekey bundle storage API (Supabase)
- [ ] Build client-side encrypted key storage (IndexedDB + expo-secure-store + react-native-quick-crypto)
- [ ] Implement prekey bundle upload and retrieval

### Phase 2: 1:1 Encryption (Weeks 4-6)

- [ ] Implement X3DH key agreement
- [ ] Implement Double Ratchet
- [ ] Build SessionCipher (encrypt/decrypt 1:1 messages)
- [ ] Wire up Supabase Realtime for message delivery
- [ ] Handle session establishment and prekey message flow
- [ ] Test with two devices

### Phase 3: Sender Keys & Basic Groups (Weeks 7-10)

- [ ] Implement Sender Key generation
- [ ] Implement SenderKeyDistributionMessage creation and parsing
- [ ] Implement GroupCipher (encrypt/decrypt group messages)
- [ ] Build Sender Key distribution over 1:1 sessions
- [ ] Implement out-of-order message handling with skipped keys
- [ ] Server-side fan-out for group messages via Supabase Realtime

### Phase 4: Zero-Knowledge Groups V2 — Server Side (Weeks 11-14)

- [ ] Generate and store ServerSecretParams / ServerPublicParams (one-time setup)
- [ ] Integrate `@signalapp/libsignal-client/zkgroup` on Next.js server
- [ ] Build AuthCredential issuance endpoint (POST /api/groups/credentials/auth)
- [ ] Build ProfileKeyCredential blinded issuance endpoint
- [ ] Build ProfileKeyCommitment registration endpoint
- [ ] Implement GroupsController: PUT (create), GET (fetch), PATCH (modify)
- [ ] Implement AuthCredentialPresentation verification on all group endpoints
- [ ] Implement group change log with versioned encrypted state
- [ ] Implement access control verification (admin vs member role checks via ZK)
- [ ] Build group invite link support with encrypted invite password

### Phase 5: Zero-Knowledge Groups V2 — Client Side (Weeks 15-18)

- [ ] Implement portable Ristretto255 KVAC operations using @noble/curves
    - [ ] UID encryption / decryption with GroupSecretParams
    - [ ] ProfileKey encryption / decryption with GroupSecretParams
    - [ ] Blob encryption / decryption (title, avatar, description)
    - [ ] GroupMasterKey → GroupSecretParams derivation
    - [ ] GroupSecretParams → GroupIdentifier derivation
- [ ] Implement AuthCredentialPresentation creation (ZK proof construction)
- [ ] Implement ProfileKeyCredentialPresentation creation
- [ ] Build credential caching + refresh logic (daily AuthCredential fetch)
- [ ] Wire up group creation flow: generate keys → encrypt state → present → upload
- [ ] Wire up group fetch: present → download → decrypt locally
- [ ] Wire up member add/remove: GroupChange + presentation → PATCH
- [ ] Test cross-platform: verify web (via libsignal-client) and mobile (via @noble)
  produce compatible ciphertexts and presentations
- [ ] Integrate Sender Key rotation on member removal via group version bump

### Phase 6: Hardening (Weeks 19-22)

- [ ] Safety number / fingerprint verification UI
- [ ] Identity key change detection and notification
- [ ] Multi-device support (Sesame protocol for session management)
- [ ] Prekey replenishment (auto-upload when count drops below 25)
- [ ] Signed prekey rotation (every 7-30 days)
- [ ] Periodic Sender Key rotation (every 24h or N messages)
- [ ] AuthCredential expiry handling + auto-renewal
- [ ] Message replay protection (counter tracking)
- [ ] Edge case handling (offline members, failed deliveries, race conditions)
- [ ] Group version conflict resolution (concurrent modifications)

### Phase 7: Production (Weeks 23+)

- [ ] Security audit by external cryptography team (MANDATORY before production)
- [ ] Sealed Sender implementation (hide sender identity from server)
- [ ] Performance optimization (batch credential issuance, key caching)
- [ ] Encrypted backup and recovery (key material + group master keys)
- [ ] Monitoring and alerting for key exhaustion, failed sessions, credential expiry
- [ ] Load testing for ZK proof verification throughput on server

## 23. Official Documentation Links

### Signal Protocol Specifications (Primary Sources)

- **Signal Documentation Index:** https://signal.org/docs/
- **X3DH Key Agreement Protocol:** https://signal.org/docs/specifications/x3dh/
- **PQXDH (Post-Quantum X3DH):** https://signal.org/docs/specifications/pqxdh/
- **Double Ratchet Algorithm:** https://signal.org/docs/specifications/doubleratchet/
- **XEdDSA and VXEdDSA Signatures:** https://signal.org/docs/specifications/xeddsa/
- **Sesame (Multi-Device Session Management):** https://signal.org/docs/specifications/sesame/

### Signal Source Code

- **libsignal (Rust core, Java/Swift/TypeScript bindings):** https://github.com/signalapp/libsignal
- **Signal-Android:** https://github.com/signalapp/Signal-Android
- **Signal-iOS:** https://github.com/signalapp/Signal-iOS
- **Signal-Desktop (Electron/TypeScript):** https://github.com/signalapp/Signal-Desktop
- **NPM: @signalapp/libsignal-client:** https://www.npmjs.com/package/@signalapp/libsignal-client

### Signal Blog Posts (Technical)

- **Private Groups (original design):** https://signal.org/blog/private-groups/
- **Signal Private Group System (Groups V2):** https://signal.org/blog/signal-private-group-system/
- **Sealed Sender:** https://signal.org/blog/sealed-sender/

### Academic Papers

- **The Signal Private Group System and Anonymous Credentials:** https://eprint.iacr.org/2019/1416.pdf
- **A Formal Security Analysis of the Signal Messaging Protocol:** https://eprint.iacr.org/2016/1013.pdf
- **Analysis and Improvements of the Sender Keys Protocol:** https://arxiv.org/pdf/2301.07045
- **The Double Ratchet: Security Notions, Proofs, and Modularization:** https://eprint.iacr.org/2018/1037

### IETF MLS (Alternative/Future Standard)

- **RFC 9420 — The Messaging Layer Security (MLS) Protocol:** https://datatracker.ietf.org/doc/rfc9420/
- **RFC 9750 — MLS Architecture:** https://datatracker.ietf.org/doc/rfc9750/
- **MLS Working Group:** https://messaginglayersecurity.rocks/
- **mls-rs (Rust MLS implementation by AWS):** https://github.com/awslabs/mls-rs

### react-native-quick-crypto

- **Official Docs:** https://margelo.github.io/react-native-quick-crypto/
- **GitHub:** https://github.com/margelo/react-native-quick-crypto
- **NPM:** https://www.npmjs.com/package/react-native-quick-crypto
- **API Coverage:** https://github.com/margelo/react-native-quick-crypto/blob/main/docs/implementation-coverage.md

### TypeScript Crypto Libraries

- **@privacyresearch/libsignal-protocol-typescript:
  ** https://github.com/privacyresearchgroup/libsignal-protocol-typescript
- **@noble/curves (Curve25519, Ed25519, audited):** https://www.npmjs.com/package/@noble/curves
- **@noble/hashes (SHA-256, HMAC, HKDF, audited):** https://www.npmjs.com/package/@noble/hashes
- **@noble/ciphers (AES-256-CBC/GCM, audited):** https://www.npmjs.com/package/@noble/ciphers

### Better Auth

- **Installation:** https://better-auth.com/docs/installation
- **Next.js Integration:** https://better-auth.com/docs/integrations/next
- **Expo Integration:** https://better-auth.com/docs/integrations/expo
- **Drizzle Adapter:** https://better-auth.com/docs/adapters/drizzle

### Drizzle ORM

- **Supabase Connection:** https://orm.drizzle.team/docs/connect-supabase
- **Supabase Tutorial:** https://orm.drizzle.team/docs/tutorials/drizzle-with-supabase
- **Expo SQLite:** https://orm.drizzle.team/docs/connect-expo-sqlite
- **RLS Support:** https://orm.drizzle.team/docs/rls
- **Web & Mobile Migrations:** https://orm.drizzle.team/docs/kit-web-mobile

### Supabase

- **Drizzle Integration:** https://supabase.com/docs/guides/database/drizzle
- **Realtime:** https://supabase.com/docs/guides/realtime

### WhatsApp Encryption Whitepaper (Uses Signal + Sender Keys)

- https://www.whatsapp.com/security/WhatsApp-Security-Whitepaper.pdf

---

*This document was compiled from Signal's official specifications, the Signal
open-source codebase, published academic analyses, the IETF MLS standards,
and the official documentation for Better Auth, Drizzle ORM, react-native-quick-crypto,
Supabase, Expo, and Next.js. All protocol descriptions follow Signal's reference
implementation as documented in their specifications and code.*
