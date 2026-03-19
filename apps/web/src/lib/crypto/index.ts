import { setCryptoProvider } from "@openhospi/crypto";
import { createWebCryptoProvider } from "@openhospi/crypto/web";

import { IndexedDBProtocolStore } from "./indexeddb-store";

// Initialize the Web Crypto provider
setCryptoProvider(createWebCryptoProvider());

// Singleton store instance
export const cryptoStore = new IndexedDBProtocolStore();
