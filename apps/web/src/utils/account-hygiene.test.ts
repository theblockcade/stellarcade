import { describe, it, expect } from "vitest";
import { scanAccountHygiene, SAMPLE_HYGIENE_ACCOUNTS } from "./account-hygiene";

describe("account-hygiene utility", () => {
  it("scans sample hygiene accounts and calculates reserve reclamation accurately", () => {
    const key = "GBBD47IF6LWK7P7MDEVSCADEPLAYERHYGIENE777SAMPLEPUBLICKEY";
    const result = scanAccountHygiene(key);

    expect(result.accountPublicKey).toBe(key);
    expect(result.totalSubentries).toBe(4);
    expect(result.totalLockedReserveXlm).toBe(2.0);
    expect(result.reclaimableSubentries).toHaveLength(3);
    expect(result.reclaimableReserveXlm).toBe(1.5);
  });

  it("handles arbitrary Stellar public keys gracefully with fallback entries", () => {
    const result = scanAccountHygiene("GABC1234567890TESTKEY");
    expect(result.accountPublicKey).toBe("GABC1234567890TESTKEY");
    expect(result.reclaimableSubentries.length).toBeGreaterThan(0);
    expect(result.reclaimableReserveXlm).toBeGreaterThan(0);
  });
});
