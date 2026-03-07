CREATE TABLE `cached_profiles` (
	`id` text PRIMARY KEY,
	`data` text NOT NULL,
	`fetched_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `message_drafts` (
	`conversation_id` text PRIMARY KEY,
	`content` text NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `preferences` (
	`key` text PRIMARY KEY,
	`value` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `sync_metadata` (
	`entity_type` text PRIMARY KEY,
	`last_synced_at` integer NOT NULL,
	`cursor` text
);
