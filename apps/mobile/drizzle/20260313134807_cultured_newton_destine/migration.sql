CREATE TABLE `cached_profiles` (
	`id` text PRIMARY KEY,
	`data` text NOT NULL,
	`fetched_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `encrypted_store` (
	`key` text PRIMARY KEY,
	`value` text NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `identity_keys` (
	`id` integer PRIMARY KEY AUTOINCREMENT,
	`registration_id` integer NOT NULL,
	`public_key` text NOT NULL,
	`private_key` text NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `key_verifications` (
	`peer_user_id` text PRIMARY KEY,
	`signing_public_key` text NOT NULL,
	`verified_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `local_messages` (
	`id` text PRIMARY KEY,
	`conversation_id` text NOT NULL,
	`sender_user_id` text NOT NULL,
	`plaintext` text NOT NULL,
	`timestamp` integer NOT NULL,
	`status` text DEFAULT 'sent' NOT NULL
);
--> statement-breakpoint
CREATE TABLE `message_drafts` (
	`conversation_id` text PRIMARY KEY,
	`content` text NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `pre_keys` (
	`key_id` integer PRIMARY KEY,
	`public_key` text NOT NULL,
	`private_key` text NOT NULL,
	`uploaded` integer DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE `preferences` (
	`key` text PRIMARY KEY,
	`value` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `sender_keys` (
	`id` integer PRIMARY KEY AUTOINCREMENT,
	`composite_key` text NOT NULL,
	`sender_key_data` text NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `sessions` (
	`id` integer PRIMARY KEY AUTOINCREMENT,
	`address` text NOT NULL,
	`session_data` text NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `signed_pre_keys` (
	`key_id` integer PRIMARY KEY,
	`public_key` text NOT NULL,
	`private_key` text NOT NULL,
	`signature` text NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `skipped_keys` (
	`id` integer PRIMARY KEY AUTOINCREMENT,
	`address` text NOT NULL,
	`message_index` integer NOT NULL,
	`message_key` text NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `sync_metadata` (
	`entity_type` text PRIMARY KEY,
	`last_synced_at` integer NOT NULL,
	`cursor` text
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_sender_keys_composite` ON `sender_keys` (`composite_key`);--> statement-breakpoint
CREATE UNIQUE INDEX `idx_sessions_address` ON `sessions` (`address`);