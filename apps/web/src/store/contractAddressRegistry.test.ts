import { describe, it, expect } from "vitest";
import { ContractAddressRegistry } from "./contractAddressRegistry";

const VALID_ADDR_1 = "C" + "A".repeat(55);
const VALID_ADDR_2 = "C" + "B".repeat(55);
const VALID_ADDR_3 = "C" + "C".repeat(55);
const VALID_ADDR_4 = "C" + "D".repeat(55);
const VALID_ADDR_5 = "C" + "E".repeat(55);

describe("ContractAddressRegistry", () => {
  it("validates and returns contract addresses correctly", () => {
    const registry = ContractAddressRegistry.fromObject({
      prizePool: VALID_ADDR_1,
      achievementBadge: VALID_ADDR_2,
      accessControl: VALID_ADDR_3,
      coinFlip: VALID_ADDR_4,
      randomGenerator: VALID_ADDR_5,
    });

    expect(registry.getAddress("prizePool")).toBe(VALID_ADDR_1);
    expect(registry.getAddress("coinFlip")).toBe(VALID_ADDR_4);
  });
});
