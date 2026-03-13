// ── Base64 Codec ──

const BASE64_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

export function toBase64(bytes: Uint8Array): string {
  let result = "";
  const len = bytes.length;
  for (let i = 0; i < len; i += 3) {
    const b0 = bytes[i]!;
    const b1 = i + 1 < len ? bytes[i + 1]! : 0;
    const b2 = i + 2 < len ? bytes[i + 2]! : 0;

    result += BASE64_CHARS[(b0 >> 2)!];
    result += BASE64_CHARS[((b0 & 3) << 4) | (b1 >> 4)]!;
    result += i + 1 < len ? BASE64_CHARS[((b1 & 15) << 2) | (b2 >> 6)]! : "=";
    result += i + 2 < len ? BASE64_CHARS[b2 & 63]! : "=";
  }
  return result;
}

export function fromBase64(str: string): Uint8Array {
  const cleaned = str.replace(/=+$/, "");
  const bytes = new Uint8Array(Math.floor((cleaned.length * 3) / 4));
  let j = 0;
  for (let i = 0; i < cleaned.length; i += 4) {
    const a = BASE64_CHARS.indexOf(cleaned[i]!);
    const b = BASE64_CHARS.indexOf(cleaned[i + 1]!);
    const c = i + 2 < cleaned.length ? BASE64_CHARS.indexOf(cleaned[i + 2]!) : 0;
    const d = i + 3 < cleaned.length ? BASE64_CHARS.indexOf(cleaned[i + 3]!) : 0;

    bytes[j++] = (a << 2) | (b >> 4);
    if (i + 2 < cleaned.length) bytes[j++] = ((b & 15) << 4) | (c >> 6);
    if (i + 3 < cleaned.length) bytes[j++] = ((c & 3) << 6) | d;
  }
  return bytes.subarray(0, j);
}

// ── Byte Utilities ──

export function concatBytes(...arrays: Uint8Array[]): Uint8Array {
  const totalLength = arrays.reduce((sum, arr) => sum + arr.length, 0);
  const result = new Uint8Array(totalLength);
  let offset = 0;
  for (const arr of arrays) {
    result.set(arr, offset);
    offset += arr.length;
  }
  return result;
}

/** Constant-time comparison to prevent timing attacks. */
export function bytesEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a[i]! ^ b[i]!;
  }
  return diff === 0;
}

/** Convert a UTF-8 string to Uint8Array. */
export function utf8ToBytes(str: string): Uint8Array {
  return new TextEncoder().encode(str);
}

/** Convert Uint8Array to UTF-8 string. */
export function bytesToUtf8(bytes: Uint8Array): string {
  return new TextDecoder().decode(bytes);
}

/** Encode a uint32 as 4-byte big-endian. */
export function uint32ToBytes(n: number): Uint8Array {
  const buf = new Uint8Array(4);
  buf[0] = (n >>> 24) & 0xff;
  buf[1] = (n >>> 16) & 0xff;
  buf[2] = (n >>> 8) & 0xff;
  buf[3] = n & 0xff;
  return buf;
}

/** Decode 4-byte big-endian to uint32. */
export function bytesToUint32(buf: Uint8Array): number {
  return ((buf[0]! << 24) | (buf[1]! << 16) | (buf[2]! << 8) | buf[3]!) >>> 0;
}
