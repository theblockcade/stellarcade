import { describe, it, expect } from "vitest";
import {
  validateWager,
  validateGameId,
  validateEnum,
  validateStellarAddress,
  validateContractAddress,
  validateSha256Hash,
} from "./validation";

describe("validation", () => {
  it("validates wagers within bounds", () => {
    const valid = validateWager("20000000");
    expect(valid.success).toBe(true);
    if (valid.success) {
      expect(valid.data).toBe(20000000n);
    }

    const invalid = validateWager("0");
    expect(invalid.success).toBe(false);
  });

  it("validates stellar and contract addresses", () => {
    const validStellar = "G" + "A".repeat(55);
    expect(validateStellarAddress(validStellar).success).toBe(true);

    const validContract = "C" + "B".repeat(55);
    expect(validateContractAddress(validContract).success).toBe(true);
  });

  it("validates sha256 hashes", () => {
    const validHash = "a".repeat(64);
    expect(validateSha256Hash(validHash).success).toBe(true);
    expect(validateSha256Hash("short").success).toBe(false);
  });
});
