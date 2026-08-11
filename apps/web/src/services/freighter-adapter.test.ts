import { describe, it, expect, vi, beforeEach } from "vitest";
import { FreighterAdapter } from "./freighter-adapter";
import * as freighterApi from "@stellar/freighter-api";
import { ProviderNotFoundError, RejectedSignatureError } from "../types/wallet-session";

vi.mock("@stellar/freighter-api", () => ({
  isConnected: vi.fn(),
  isAllowed: vi.fn(),
  requestAccess: vi.fn(),
  getAddress: vi.fn(),
  getNetwork: vi.fn(),
  signMessage: vi.fn(),
  signTransaction: vi.fn(),
}));

describe("FreighterAdapter", () => {
  let adapter: FreighterAdapter;

  beforeEach(() => {
    vi.clearAllMocks();
    adapter = new FreighterAdapter();
  });

  it("throws ProviderNotFoundError when freighter extension is not installed", async () => {
    vi.mocked(freighterApi.isConnected).mockResolvedValue({ isConnected: false });
    await expect(adapter.connect()).rejects.toThrow(ProviderNotFoundError);
  });

  it("successfully connects when Freighter is installed and returns address", async () => {
    vi.mocked(freighterApi.isConnected).mockResolvedValue({ isConnected: true });
    vi.mocked(freighterApi.requestAccess).mockResolvedValue({ address: "GBZXN7PIRZGNMHGA72STUFIO" });
    vi.mocked(freighterApi.getNetwork).mockResolvedValue({ network: "TESTNET", networkPassphrase: "Test SDF Network ; September 2015" });

    const result = await adapter.connect();
    expect(result.address).toBe("GBZXN7PIRZGNMHGA72STUFIO");
    expect(result.provider.id).toBe("freighter");
    expect(result.network).toBe("TESTNET");
  });

  it("handles user rejection gracefully", async () => {
    vi.mocked(freighterApi.isConnected).mockResolvedValue({ isConnected: true });
    vi.mocked(freighterApi.requestAccess).mockRejectedValue(new Error("User rejected"));

    await expect(adapter.connect()).rejects.toThrow(RejectedSignatureError);
  });
});
