import { integer, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core';

// ── Identity Keys (one row per device installation) ──

export const identityKeys = sqliteTable('identity_keys', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  registrationId: integer('registration_id').notNull(),
  publicKey: text('public_key').notNull(),
  privateKey: text('private_key').notNull(), // encrypted
  signingPublicKey: text('signing_public_key'),
  signingPrivateKey: text('signing_private_key'),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date()),
});

// ── One-Time PreKeys (our unused prekeys) ──

export const preKeys = sqliteTable('pre_keys', {
  keyId: integer('key_id').primaryKey(),
  publicKey: text('public_key').notNull(),
  privateKey: text('private_key').notNull(), // encrypted
  uploaded: integer('uploaded', { mode: 'boolean' }).notNull().default(false),
});

// ── Signed PreKeys ──

export const signedPreKeys = sqliteTable('signed_pre_keys', {
  keyId: integer('key_id').primaryKey(),
  publicKey: text('public_key').notNull(),
  privateKey: text('private_key').notNull(), // encrypted
  signature: text('signature').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date()),
});

// ── Sessions (Double Ratchet state per remote device) ──

export const sessions = sqliteTable(
  'sessions',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    address: text('address').notNull(), // format: userId.deviceId
    sessionData: text('session_data').notNull(), // encrypted serialized session state
    updatedAt: integer('updated_at', { mode: 'timestamp' })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => [uniqueIndex('idx_sessions_address').on(table.address)]
);

// ── Sender Keys (per group per sender) ──

export const senderKeys = sqliteTable(
  'sender_keys',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    compositeKey: text('composite_key').notNull(), // format: conversationId:senderAddress
    senderKeyData: text('sender_key_data').notNull(), // encrypted
    updatedAt: integer('updated_at', { mode: 'timestamp' })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => [uniqueIndex('idx_sender_keys_composite').on(table.compositeKey)]
);

// ── Local Message Cache (decrypted plaintext) ──

export const localMessages = sqliteTable('local_messages', {
  id: text('id').primaryKey(), // server UUID
  conversationId: text('conversation_id').notNull(),
  senderUserId: text('sender_user_id').notNull(),
  plaintext: text('plaintext').notNull(),
  timestamp: integer('timestamp', { mode: 'timestamp' }).notNull(),
  status: text('status').notNull().default('sent'), // sent | delivered | read
});

// ── Skipped Message Keys (out-of-order delivery) ──

export const skippedKeys = sqliteTable('skipped_keys', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  address: text('address').notNull(), // userId.deviceId
  messageIndex: integer('message_index').notNull(),
  messageKey: text('message_key').notNull(), // encrypted
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date()),
});

// ── Encrypted Key-Value Store (backing for SecureStorage, replaced in Phase 5) ──

export const encryptedStore = sqliteTable('encrypted_store', {
  key: text('key').primaryKey(),
  value: text('value').notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
});

// ── App Tables (kept from existing schema) ──

export const preferences = sqliteTable('preferences', {
  key: text('key').primaryKey(),
  value: text('value').notNull(),
});

export const cachedProfiles = sqliteTable('cached_profiles', {
  id: text('id').primaryKey(),
  data: text('data').notNull(),
  fetchedAt: integer('fetched_at', { mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const messageDrafts = sqliteTable('message_drafts', {
  conversationId: text('conversation_id').primaryKey(),
  content: text('content').notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const syncMetadata = sqliteTable('sync_metadata', {
  entityType: text('entity_type').primaryKey(),
  lastSyncedAt: integer('last_synced_at', { mode: 'timestamp' }).notNull(),
  cursor: text('cursor'),
});

// ── Trusted Identity Keys (TOFU — trust on first use) ──

export const trustedIdentities = sqliteTable('trusted_identities', {
  address: text('address').primaryKey(), // format: userId:deviceId
  identityKey: text('identity_key').notNull(), // base64-encoded public key
  firstSeenAt: integer('first_seen_at', { mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const keyVerifications = sqliteTable('key_verifications', {
  peerUserId: text('peer_user_id').primaryKey(),
  signingPublicKey: text('signing_public_key').notNull(),
  verifiedAt: integer('verified_at', { mode: 'timestamp' }).notNull(),
});
