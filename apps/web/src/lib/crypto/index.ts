import { setCryptoProvider } from "@openhospi/crypto";
import { createWebCryptoProvider } from "@openhospi/crypto/web";

import { IndexedDBSignalStore } from "./indexeddb-store";
import { SentMessageCache } from "./sent-message-cache";

// Initialize the Web Crypto provider
setCryptoProvider(createWebCryptoProvider());

// Singleton store instance
export const cryptoStore = new IndexedDBSignalStore();

// Sent message cache (plaintext of own messages — Signal senders can't decrypt their own)
export const sentMessageCache = new SentMessageCache();
