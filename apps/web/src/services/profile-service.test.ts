import { describe, expect, it } from "vitest";

import { needsOnboarding, validateUsername } from "./profile-service";
import type { UserProfile } from "../types/api-client";

const complete: UserProfile = {
  address: "GABC123",
  username: "nova_runner",
  createdAt: "2026-01-01T00:00:00.000Z",
  ageConfirmedAt: "2026-01-01T00:00:00.000Z",
};

describe("validateUsername", () => {
  it("accepts a normal name", () => {
    expect(validateUsername("nova_runner")).toBeNull();
    expect(validateUsername("a.b-c_1")).toBeNull();
  });

  it("rejects empty and whitespace-only names", () => {
    expect(validateUsername("")).toMatch(/choose a username/i);
    expect(validateUsername("   ")).toMatch(/choose a username/i);
  });

  it("enforces length bounds", () => {
    expect(validateUsername("ab")).toMatch(/3-20 characters/);
    expect(validateUsername("x".repeat(21))).toMatch(/3-20 characters/);
  });

  it("rejects characters outside the allowed set", () => {
    expect(validateUsername("nova runner")).toMatch(/letters, numbers/i);
    expect(validateUsername("nova@runner")).toMatch(/letters, numbers/i);
    expect(validateUsername("<script>")).toMatch(/letters, numbers/i);
  });
});

describe("needsOnboarding", () => {
  it("is false only for a profile with both a username and an age confirmation", () => {
    expect(needsOnboarding(complete)).toBe(false);
  });

  it("is true when there is no profile at all", () => {
    expect(needsOnboarding(null)).toBe(true);
    expect(needsOnboarding(undefined)).toBe(true);
  });

  it("is true when the username is missing or blank", () => {
    expect(needsOnboarding({ ...complete, username: undefined })).toBe(true);
    expect(needsOnboarding({ ...complete, username: "   " })).toBe(true);
  });

  /*
   * A profile that predates the age gate has no ageConfirmedAt. Treating a
   * missing confirmation as an implicit yes would let those accounts through
   * without ever being asked, so it must count as un-onboarded.
   */
  it("is true when the age confirmation is missing", () => {
    expect(needsOnboarding({ ...complete, ageConfirmedAt: undefined })).toBe(true);
  });
});
