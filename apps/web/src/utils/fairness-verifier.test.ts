import { describe, it, expect } from "vitest";
import {
  sha256Hex,
  mapToRange,
  verifyFairnessProof,
  FAIRNESS_TEST_VECTORS,
} from "./fairness-verifier";

describe("fairness-verifier utility", () => {
  it("computes accurate SHA-256 digests in hex", async () => {
    const hash = await sha256Hex("stellar-arcade-test-vector");
    expect(hash).toHaveLength(64);
    expect(typeof hash).toBe("string");
  });

  it("maps BigInt values onto bounded ranges accurately", () => {
    expect(mapToRange(BigInt(0), 2)).toBe(0);
    expect(mapToRange(BigInt(1), 2)).toBe(1);
    expect(mapToRange(BigInt(10), 6)).toBe(4);
    expect(mapToRange(BigInt(100), 10)).toBe(0);
  });

  it("throws for invalid range size <= 0", () => {
    expect(() => mapToRange(BigInt(5), 0)).toThrow(/Invalid outcome range size/);
  });

  it("verifies valid test vector 1 (Coin Flip)", async () => {
    const vector = FAIRNESS_TEST_VECTORS[0];
    const result = await verifyFairnessProof(vector.input);
    expect(result.isValid).toBe(true);
    expect(result.commitmentMatch).toBe(true);
    expect(result.mappedOutcome).toBeGreaterThanOrEqual(0);
    expect(result.mappedOutcome).toBeLessThan(2);
  });

  it("detects tampered commitment hash in test vector 3", async () => {
    const vector = FAIRNESS_TEST_VECTORS[2];
    const result = await verifyFairnessProof(vector.input);
    expect(result.isValid).toBe(false);
    expect(result.commitmentMatch).toBe(false);
    const commitStep = result.steps.find((s) => s.step.includes("Commitment"));
    expect(commitStep?.passed).toBe(false);
  });
});
