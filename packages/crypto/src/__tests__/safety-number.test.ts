import { describe, expect, it } from "vitest";

import { toBase64 } from "../encoding";
import { encodeSafetyNumberQR, verifySafetyNumberQR } from "../safety-number";

const fakeUserId = "550e8400-e29b-41d4-a716-446655440000";
const fakeSigningKey = new Uint8Array(32).fill(42);
const fakeSafetyNumber = "12345 67890 12345 67890 12345 67890 12345 67890 12345 67890 12345 67890";

describe("encodeSafetyNumberQR", () => {
  it("produces valid base64 containing correct JSON fields", () => {
    const encoded = encodeSafetyNumberQR(fakeUserId, fakeSigningKey, fakeSafetyNumber);

    const json = JSON.parse(atob(encoded));
    expect(json.v).toBe(1);
    expect(json.uid).toBe(fakeUserId);
    expect(json.spk).toBe(toBase64(fakeSigningKey));
    expect(json.sn).toBe(fakeSafetyNumber);
  });
});

describe("verifySafetyNumberQR", () => {
  it("returns valid: true when safety numbers match", () => {
    const encoded = encodeSafetyNumberQR(fakeUserId, fakeSigningKey, fakeSafetyNumber);
    const result = verifySafetyNumberQR(encoded, fakeSafetyNumber);

    expect(result.valid).toBe(true);
    if (result.valid) {
      expect(result.peerUserId).toBe(fakeUserId);
      expect(result.peerSigningKey).toBe(toBase64(fakeSigningKey));
    }
  });

  it("returns mismatch on wrong safety number", () => {
    const encoded = encodeSafetyNumberQR(fakeUserId, fakeSigningKey, fakeSafetyNumber);
    const result = verifySafetyNumberQR(
      encoded,
      "00000 00000 00000 00000 00000 00000 00000 00000 00000 00000 00000 00000",
    );

    expect(result).toEqual({ valid: false, reason: "mismatch" });
  });

  it("returns invalid_format on garbage input", () => {
    const result = verifySafetyNumberQR("not-valid-base64!!!", fakeSafetyNumber);
    expect(result).toEqual({ valid: false, reason: "invalid_format" });
  });

  it("returns invalid_format on valid base64 but invalid JSON", () => {
    const result = verifySafetyNumberQR(btoa("not json"), fakeSafetyNumber);
    expect(result).toEqual({ valid: false, reason: "invalid_format" });
  });

  it("returns invalid_format on missing fields", () => {
    const result = verifySafetyNumberQR(btoa(JSON.stringify({ v: 1, uid: "x" })), fakeSafetyNumber);
    expect(result).toEqual({ valid: false, reason: "invalid_format" });
  });

  it("returns version_unsupported on v: 2", () => {
    const payload = btoa(
      JSON.stringify({
        v: 2,
        uid: fakeUserId,
        spk: toBase64(fakeSigningKey),
        sn: fakeSafetyNumber,
      }),
    );
    const result = verifySafetyNumberQR(payload, fakeSafetyNumber);
    expect(result).toEqual({ valid: false, reason: "version_unsupported" });
  });

  it("round-trip: encode → verify matches", () => {
    const encoded = encodeSafetyNumberQR(fakeUserId, fakeSigningKey, fakeSafetyNumber);
    const result = verifySafetyNumberQR(encoded, fakeSafetyNumber);

    expect(result).toEqual({
      valid: true,
      peerUserId: fakeUserId,
      peerSigningKey: toBase64(fakeSigningKey),
    });
  });
});
