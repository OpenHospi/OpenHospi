CREATE TABLE `key_verifications` (
	`peer_user_id` text PRIMARY KEY,
	`signing_public_key` text NOT NULL,
	`verified_at` integer NOT NULL
);
