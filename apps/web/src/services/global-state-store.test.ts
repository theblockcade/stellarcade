import { describe, it, expect, beforeEach, vi } from "vitest";
import GlobalStateStore from "./global-state-store";
import {
  isBannerDismissed,
  persistBannerDismissal,
  getSavedFilterPresets,
  saveFilterPreset,
  deleteSavedFilterPreset,
  getTableDensityPreference,
  persistTableDensityPreference,
} from "./global-state-store";

/**
 * Ported from frontend/tests/global-state.test.ts, minus the two cases that
 * exercise NetworkGuardBanner / ErrorNotice component integration — those
 * components aren't ported yet (see MIGRATION.md). The store-level banner
 * dismissal logic those tests exercised indirectly is still covered here
 * directly via isBannerDismissed/persistBannerDismissal.
 */

beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
});

describe("GlobalStateStore", () => {
  it("initializes with defaults and persists auth/flags", () => {
    const store = new GlobalStateStore({ storageKey: "test_state" });
    expect(store.getState().auth.isAuthenticated).toBe(false);

    store.dispatch({
      type: "AUTH_SET",
      payload: { userId: "u1", token: "t1" },
    });
    store.dispatch({
      type: "FLAGS_SET",
      payload: { key: "feature_x", value: true },
    });

    const raw = JSON.parse(localStorage.getItem("test_state") as string);
    expect(raw.auth.userId).toBe("u1");
    expect(raw.flags.feature_x).toBe(true);
  });

  it("clears wallet as ephemeral and does not persist", () => {
    const store = new GlobalStateStore({ storageKey: "test_state2" });
    store.dispatch({
      type: "WALLET_SET",
      payload: {
        meta: {
          address: "GABC",
          provider: { id: "m", name: "m" },
          network: "TESTNET",
          connectedAt: Date.now(),
        },
      } as any,
    });
    const raw = JSON.parse(localStorage.getItem("test_state2") as string);
    expect(raw.wallet).toBeUndefined();
  });

  it("persists and restores banner dismissals by key and identity", () => {
    expect(isBannerDismissed("network-guard-banner", "testnet:v1")).toBe(false);

    persistBannerDismissal("network-guard-banner", "testnet:v1", true);
    expect(isBannerDismissed("network-guard-banner", "testnet:v1")).toBe(true);
  });

  it("resets dismissal when banner identity changes", () => {
    persistBannerDismissal("network-guard-banner", "testnet:v1", true);
    expect(isBannerDismissed("network-guard-banner", "testnet:v1")).toBe(true);
    expect(isBannerDismissed("network-guard-banner", "testnet:v2")).toBe(false);
  });

  it("persists and restores pending transactions", () => {
    const store = new GlobalStateStore({ storageKey: "pending_tx_test" });
    const snapshot = {
      operation: "swap.play",
      phase: "CONFIRMING",
      startedAt: Date.now(),
      updatedAt: Date.now(),
    };

    store.dispatch({
      type: "PENDING_TX_SET",
      payload: { snapshot },
    });

    const store2 = new GlobalStateStore({ storageKey: "pending_tx_test" });
    expect(store2.getState().pendingTransaction).toEqual(snapshot);
  });

  it("invalidates stale pending transactions after 30 minutes", async () => {
    const started = Date.now() - 31 * 60 * 1000;

    const payload = {
      auth: { isAuthenticated: false },
      flags: {},
      pendingTransaction: {
        operation: "swap.play",
        phase: "SUBMITTING",
        startedAt: started,
        updatedAt: started,
      },
      storedAt: started,
    };
    localStorage.setItem("stale_tx_test", JSON.stringify(payload));

    const store2 = new GlobalStateStore({ storageKey: "stale_tx_test" });
    expect(store2.getState().pendingTransaction).toBeNull();
  });

  it("saves and restores filter presets by scope", () => {
    const saved = saveFilterPreset("events", "High signal", ["coin_flip", "transfer"]);
    expect(saved?.name).toBe("High signal");

    const presets = getSavedFilterPresets("events");
    expect(presets).toHaveLength(1);
    expect(presets[0].values).toEqual(["coin_flip", "transfer"]);
  });

  it("deletes saved presets without affecting other scopes", () => {
    const first = saveFilterPreset("events", "Errors", ["error"]);
    saveFilterPreset("activity", "Wins", ["win"]);

    deleteSavedFilterPreset("events", first?.id ?? "");

    expect(getSavedFilterPresets("events")).toEqual([]);
    expect(getSavedFilterPresets("activity")).toHaveLength(1);
  });

  it("overwrites deterministic preset ids within the same scope", () => {
    saveFilterPreset("events", "Focus", ["coin_flip"]);
    saveFilterPreset("events", "Focus", ["transfer"]);

    const presets = getSavedFilterPresets("events");
    expect(presets).toHaveLength(1);
    expect(presets[0].values).toEqual(["transfer"]);
  });

  it("persists and restores table density preferences by scope", () => {
    expect(getTableDensityPreference("leaderboard")).toBe("standard");

    persistTableDensityPreference("leaderboard", "compact");

    expect(getTableDensityPreference("leaderboard")).toBe("compact");
    expect(getTableDensityPreference("events")).toBe("standard");
  });
});
