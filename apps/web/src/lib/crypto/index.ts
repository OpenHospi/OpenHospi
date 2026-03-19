import { setCryptoProvider } from "@openhospi/crypto";
import { createWebCryptoProvider } from "@openhospi/crypto/web";

import { IndexedDBSignalStore } from "./indexeddb-store";
import { MessagePlaintextCache } from "./sent-message-cache";

// Initialize the Web Crypto provider
setCryptoProvider(createWebCryptoProvider());

// Singleton store instance
export const cryptoStore = new IndexedDBSignalStore();

// Message plaintext cache (all messages — crypto keys are one-time use, cache after first decrypt)
export const messageCache = new MessagePlaintextCache();

// Backward-compat alias used by chat-input.tsx
export const sentMessageCache = messageCache;
