import { describe, expect, it } from "vitest";

import { getInstitution, INSTITUTION_MAP } from "./institution-mapping";

describe("INSTITUTION_MAP", () => {
  it("contains well-known universities", () => {
    expect(INSTITUTION_MAP.size).toBeGreaterThanOrEqual(50);
  });

  it("looks up known entity IDs", () => {
    const rug = getInstitution("https://signon.rug.nl/nidp/saml2/metadata");
    expect(rug.short).toBe("RUG");
    expect(rug.name.nl).toBe("Rijksuniversiteit Groningen");
    expect(rug.name.en).toBe("University of Groningen");
  });

  it("looks up HvA by entity ID", () => {
    const hva = getInstitution("http://login.hva.nl/adfs/services/trust");
    expect(hva.short).toBe("HvA");
  });

  it("looks up UMCG by entity ID", () => {
    const umcg = getInstitution("https://sts.windows.net/335122f9-d4f4-4d67-a2fc-cd6dc20dde70/");
    expect(umcg.short).toBe("UMCG");
  });

  it("returns fallback for unknown entity IDs", () => {
    const unknown = getInstitution("https://unknown.example.com/idp");
    expect(unknown.short).toBe("?");
    expect(unknown.name.nl).toBe("https://unknown.example.com/idp");
    expect(unknown.name.en).toBe("https://unknown.example.com/idp");
  });

  it("all institutions have required fields", () => {
    for (const [entityId, info] of INSTITUTION_MAP) {
      expect(info.short, `${entityId} missing short`).toBeTruthy();
      expect(info.name.nl, `${entityId} missing name.nl`).toBeTruthy();
      expect(info.name.en, `${entityId} missing name.en`).toBeTruthy();
    }
  });
});
