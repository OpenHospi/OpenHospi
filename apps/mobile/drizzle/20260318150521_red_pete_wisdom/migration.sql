CREATE TABLE `trusted_identities` (
	`address` text PRIMARY KEY,
	`identity_key` text NOT NULL,
	`first_seen_at` integer NOT NULL
);
--> statement-breakpoint
ALTER TABLE `identity_keys` ADD `signing_public_key` text;--> statement-breakpoint
ALTER TABLE `identity_keys` ADD `signing_private_key` text;