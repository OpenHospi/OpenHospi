import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

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

export const keyVerifications = sqliteTable('key_verifications', {
  peerUserId: text('peer_user_id').primaryKey(),
  signingPublicKey: text('signing_public_key').notNull(),
  verifiedAt: integer('verified_at', { mode: 'timestamp' }).notNull(),
});

export const cryptoStore = sqliteTable('crypto_store', {
  key: text('key').primaryKey(),
  value: text('value').notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
});
