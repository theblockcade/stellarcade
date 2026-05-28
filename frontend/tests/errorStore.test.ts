import { beforeEach, describe, expect, it } from "vitest";
import { useErrorStore } from "../src/store/errorStore";
import { ErrorDomain, ErrorSeverity } from "../src/types/errors";
import type { AppError } from "../src/types/errors";

function makeError(code: string, message = "test error"): AppError {
  return {
    code: code as AppError["code"],
    domain: ErrorDomain.UNKNOWN,
    severity: ErrorSeverity.TERMINAL,
    message,
  };
}

beforeEach(() => {
  useErrorStore.getState().clearToasts();
  useErrorStore.setState({
    current: null,
    history: [],
    toasts: [],
    deferredToasts: [],
    toastHistory: [],
  });
});

describe("error store", () => {
  it("tracks the latest current error and prepends history", () => {
    const a = makeError("UNKNOWN", "a");
    const b = makeError("UNKNOWN", "b");
    useErrorStore.getState().setError(a);
    useErrorStore.getState().setError(b);

    expect(useErrorStore.getState().current).toBe(b);
    expect(useErrorStore.getState().history[0]).toBe(b);
    expect(useErrorStore.getState().history[1]).toBe(a);
  });

  it("caps error history at 50 items", () => {
    for (let index = 0; index < 55; index += 1) {
      useErrorStore.getState().setError(makeError("UNKNOWN", `error-${index}`));
    }

    expect(useErrorStore.getState().history).toHaveLength(50);
    expect(useErrorStore.getState().history[0].message).toBe("error-54");
  });
});

describe("toast queueing", () => {
  it("keeps a bounded active toast stack and defers overflow", () => {
    for (let index = 0; index < 4; index += 1) {
      useErrorStore.getState().enqueueToast({
        tone: "info",
        message: `toast-${index}`,
        durationMs: 60_000,
      });
    }

    expect(useErrorStore.getState().toasts.map((toast) => toast.message)).toEqual([
      "toast-0",
      "toast-1",
      "toast-2",
    ]);
    expect(
      useErrorStore.getState().deferredToasts.map((toast) => toast.message),
    ).toEqual(["toast-3"]);
  });

  it("promotes the next deferred toast when an active toast is dismissed", () => {
    const ids = Array.from({ length: 4 }, (_, index) =>
      useErrorStore.getState().enqueueToast({
        tone: "success",
        message: `toast-${index}`,
        durationMs: 60_000,
      }),
    );

    useErrorStore.getState().dismissToast(ids[0]);

    expect(useErrorStore.getState().toasts.map((toast) => toast.message)).toEqual([
      "toast-1",
      "toast-2",
      "toast-3",
    ]);
    expect(useErrorStore.getState().deferredToasts).toHaveLength(0);
    expect(useErrorStore.getState().toastHistory[0].message).toBe("toast-0");
  });

  it("keeps dismissed history bounded", () => {
    for (let index = 0; index < 25; index += 1) {
      const id = useErrorStore.getState().enqueueToast({
        tone: "warning",
        message: `toast-${index}`,
        durationMs: 60_000,
      });
      useErrorStore.getState().dismissToast(id);
    }

    expect(useErrorStore.getState().toastHistory).toHaveLength(20);
    expect(useErrorStore.getState().toastHistory[0].message).toBe("toast-24");
  });
});
