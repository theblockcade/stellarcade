import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useFocusRecovery } from "../../../src/hooks/v1/useFocusRecovery";

describe("useFocusRecovery", () => {
  let container: HTMLDivElement;
  let errorRegion: HTMLDivElement;
  let triggerButton: HTMLButtonElement;

  beforeEach(() => {
    container = document.createElement("div");
    errorRegion = document.createElement("div");
    errorRegion.tabIndex = -1;
    triggerButton = document.createElement("button");
    container.appendChild(triggerButton);
    container.appendChild(errorRegion);
    document.body.appendChild(container);
    triggerButton.focus();
  });

  it("moves focus to the error region when hasError becomes true", () => {
    const focusSpy = vi.spyOn(errorRegion, "focus");
    const { result, rerender } = renderHook(
      ({ hasError }) => useFocusRecovery(hasError),
      { initialProps: { hasError: false } },
    );

    // Attach the ref manually
    Object.defineProperty(result.current.regionRef, "current", {
      writable: true,
      value: errorRegion,
    });

    act(() => {
      rerender({ hasError: true });
    });

    expect(focusSpy).toHaveBeenCalled();
  });

  it("restores focus to previous element when error clears", () => {
    const restoreSpy = vi.spyOn(triggerButton, "focus");
    triggerButton.focus();

    const { result, rerender } = renderHook(
      ({ hasError }) => useFocusRecovery(hasError),
      { initialProps: { hasError: false } },
    );

    Object.defineProperty(result.current.regionRef, "current", {
      writable: true,
      value: errorRegion,
    });

    // Trigger error — captures triggerButton as previous focus
    act(() => {
      rerender({ hasError: true });
    });

    // Clear error — should restore focus
    act(() => {
      rerender({ hasError: false });
    });

    expect(restoreSpy).toHaveBeenCalled();
  });

  it("does not move focus when focusOnError is false", () => {
    const focusSpy = vi.spyOn(errorRegion, "focus");
    const { result, rerender } = renderHook(
      ({ hasError }) => useFocusRecovery(hasError, { focusOnError: false }),
      { initialProps: { hasError: false } },
    );

    Object.defineProperty(result.current.regionRef, "current", {
      writable: true,
      value: errorRegion,
    });

    act(() => {
      rerender({ hasError: true });
    });

    expect(focusSpy).not.toHaveBeenCalled();
  });

  it("does not restore focus when restoreOnClear is false", () => {
    triggerButton.focus();
    const restoreSpy = vi.spyOn(triggerButton, "focus");

    const { result, rerender } = renderHook(
      ({ hasError }) => useFocusRecovery(hasError, { restoreOnClear: false }),
      { initialProps: { hasError: false } },
    );

    Object.defineProperty(result.current.regionRef, "current", {
      writable: true,
      value: errorRegion,
    });

    act(() => {
      rerender({ hasError: true });
    });

    act(() => {
      rerender({ hasError: false });
    });

    expect(restoreSpy).not.toHaveBeenCalled();
  });
});
