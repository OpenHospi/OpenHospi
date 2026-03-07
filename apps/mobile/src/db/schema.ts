import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const preferences = sqliteTable('preferences', {
  key: text('key').primaryKey(),
  value: text('value').notNull(),
});

export const cachedProfiles = sqliteTable('cached_profiles', {
  id: text('id').primaryKey(),
  data: text('data').notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' })
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
