/**
 * @vitest-environment happy-dom
 */

import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { useRestartFlow } from "@/hooks/v1/useRestartFlow";

const FLOW_KEY = (id: string) => `stellarcade:restart-flow:${id}`;

beforeEach(() => {
  window.sessionStorage.clear();
});

afterEach(() => {
  window.sessionStorage.clear();
});

describe("useRestartFlow (#786)", () => {
  it("returns no persisted state and no prompt when storage is empty", () => {
    const { result } = renderHook(() =>
      useRestartFlow({ flowId: "submit-update" })
    );
    expect(result.current.persistedState).toBeNull();
    expect(result.current.showRestartPrompt).toBe(false);
  });

  it("persists recorded progress and surfaces a prompt on a fresh mount", () => {
    // Seed storage to simulate a tab returning after navigation.
    window.sessionStorage.setItem(
      FLOW_KEY("submit-update"),
      JSON.stringify({
        flowId: "submit-update",
        currentStepId: "verify",
        label: "Submit wallet update",
        updatedAt: Date.now() - 30_000,
      })
    );

    const { result } = renderHook(() =>
      useRestartFlow({ flowId: "submit-update" })
    );
    expect(result.current.persistedState?.currentStepId).toBe("verify");
    expect(result.current.showRestartPrompt).toBe(true);
  });

  it("drops expired flows and never prompts for them", () => {
    window.sessionStorage.setItem(
      FLOW_KEY("expired"),
      JSON.stringify({
        flowId: "expired",
        currentStepId: "review",
        updatedAt: 0, // way in the past
      })
    );

    const { result } = renderHook(() =>
      useRestartFlow({
        flowId: "expired",
        now: () => 60 * 60 * 1000,
        maxAgeMs: 1_000,
      })
    );
    expect(result.current.persistedState).toBeNull();
    expect(result.current.showRestartPrompt).toBe(false);
    // The expired record is removed from storage as a side effect.
    expect(window.sessionStorage.getItem(FLOW_KEY("expired"))).toBeNull();
  });

  it("recordProgress writes to sessionStorage and updates the persisted state", () => {
    const { result } = renderHook(() =>
      useRestartFlow({ flowId: "x", now: () => 1_700_000_000 })
    );
    act(() => result.current.recordProgress("review", "Submit wallet update"));
    const raw = window.sessionStorage.getItem(FLOW_KEY("x"));
    expect(raw).not.toBeNull();
    const parsed = JSON.parse(raw!);
    expect(parsed.currentStepId).toBe("review");
    expect(parsed.label).toBe("Submit wallet update");
    expect(parsed.updatedAt).toBe(1_700_000_000);
    expect(result.current.persistedState?.currentStepId).toBe("review");
  });

  it("resolve('restart') clears storage and hides the prompt", () => {
    window.sessionStorage.setItem(
      FLOW_KEY("y"),
      JSON.stringify({
        flowId: "y",
        currentStepId: "verify",
        updatedAt: Date.now(),
      })
    );
    const { result } = renderHook(() => useRestartFlow({ flowId: "y" }));
    expect(result.current.showRestartPrompt).toBe(true);
    act(() => result.current.resolve("restart"));
    expect(result.current.showRestartPrompt).toBe(false);
    expect(window.sessionStorage.getItem(FLOW_KEY("y"))).toBeNull();
  });

  it("resolve('resume') hides the prompt but keeps the saved progress", () => {
    const seed = {
      flowId: "z",
      currentStepId: "verify",
      updatedAt: Date.now(),
    };
    window.sessionStorage.setItem(FLOW_KEY("z"), JSON.stringify(seed));
    const { result } = renderHook(() => useRestartFlow({ flowId: "z" }));
    act(() => result.current.resolve("resume"));
    expect(result.current.showRestartPrompt).toBe(false);
    // Storage is *not* cleared — the calling flow restores state from it.
    expect(window.sessionStorage.getItem(FLOW_KEY("z"))).not.toBeNull();
  });
});
