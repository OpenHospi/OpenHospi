"use client";

import { setCryptoProvider } from "@openhospi/crypto";
import { createWebCryptoProvider, IndexedDBCryptoStore } from "@openhospi/crypto/web";

// Initialize the crypto provider for Web (noble/curves + Web Crypto API)
setCryptoProvider(createWebCryptoProvider());

const INDEXED_DB_NAME = "openhospi-crypto";
const INDEXED_DB_VERSION = 1;
const INDEXED_DB_IDENTITY_STORE = "identity";
const INDEXED_DB_SESSION_STORE = "sessions";
const INDEXED_DB_PREKEY_STORE = "prekeys";

export const cryptoStore = new IndexedDBCryptoStore(
  INDEXED_DB_NAME,
  INDEXED_DB_VERSION,
  INDEXED_DB_IDENTITY_STORE,
  INDEXED_DB_SESSION_STORE,
  INDEXED_DB_PREKEY_STORE,
);
