// E2EE key backup
export const PBKDF2_ITERATIONS = 600_000;
export const PIN_LENGTH = 6;

// Signal Sender Keys constants
export const MAX_SENDER_KEY_FORWARD_SKIP = 2000;
export const SIGNED_PRE_KEY_ROTATION_DAYS = 7;
export const ONE_TIME_PRE_KEY_BATCH_SIZE = 100;
export const ONE_TIME_PRE_KEY_REFILL_THRESHOLD = 25;
export const SENDER_KEY_MAX_MESSAGES = 500;
export const SENDER_KEY_MAX_AGE_MS = 24 * 60 * 60 * 1000; // 24 hours
