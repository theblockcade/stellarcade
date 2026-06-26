/**
 * @vitest-environment happy-dom
 */

import { act, render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { renderHook } from "@testing-library/react";
import { ToastQueue, type Toast } from "@/components/ToastQueue";
import { useToastQueue } from "@/components/useToastQueue";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeToast(overrides: Partial<Toast> & { id: string }): Toast {
  return {
    message: "Default message",
    type: "info",
    duration: 4000,
    ...overrides,
  };
}

describe("ToastQueue (#940)", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
  });

  // ---------------------------------------------------------------------------
  // Empty queue
  // ---------------------------------------------------------------------------
  it("renders nothing when toasts array is empty", () => {
    const { container } = render(
      <ToastQueue toasts={[]} onDismiss={vi.fn()} />
    );
    expect(container.firstChild).toBeNull();
  });

  // ---------------------------------------------------------------------------
  // Rendering toasts
  // ---------------------------------------------------------------------------
  it("renders a toast with the correct message", () => {
    const toasts: Toast[] = [makeToast({ id: "t1", message: "Hello world" })];
    render(<ToastQueue toasts={toasts} onDismiss={vi.fn()} />);
    expect(screen.getByTestId("toast-message-t1")).toHaveTextContent(
      "Hello world"
    );
  });

  it("renders multiple toasts", () => {
    const toasts: Toast[] = [
      makeToast({ id: "t1", message: "First" }),
      makeToast({ id: "t2", message: "Second" }),
      makeToast({ id: "t3", message: "Third" }),
    ];
    render(<ToastQueue toasts={toasts} onDismiss={vi.fn()} />);
    expect(screen.getByTestId("toast-item-t1")).toBeInTheDocument();
    expect(screen.getByTestId("toast-item-t2")).toBeInTheDocument();
    expect(screen.getByTestId("toast-item-t3")).toBeInTheDocument();
  });

  it("renders the toast queue container", () => {
    const toasts: Toast[] = [makeToast({ id: "t1" })];
    render(<ToastQueue toasts={toasts} onDismiss={vi.fn()} />);
    expect(screen.getByTestId("toast-queue")).toBeInTheDocument();
  });

  // ---------------------------------------------------------------------------
  // Dismiss on click
  // ---------------------------------------------------------------------------
  it("calls onDismiss with the correct id when close button is clicked", () => {
    const onDismiss = vi.fn();
    const toasts: Toast[] = [makeToast({ id: "t1", message: "Click me" })];
    render(<ToastQueue toasts={toasts} onDismiss={onDismiss} />);
    fireEvent.click(screen.getByTestId("toast-dismiss-t1"));
    expect(onDismiss).toHaveBeenCalledOnce();
    expect(onDismiss).toHaveBeenCalledWith("t1");
  });

  it("dismiss button has an accessible aria-label", () => {
    const toasts: Toast[] = [
      makeToast({ id: "t1", message: "Something happened" }),
    ];
    render(<ToastQueue toasts={toasts} onDismiss={vi.fn()} />);
    expect(
      screen.getByRole("button", { name: /dismiss notification/i })
    ).toBeInTheDocument();
  });

  // ---------------------------------------------------------------------------
  // Auto-dismiss
  // ---------------------------------------------------------------------------
  it("calls onDismiss automatically after the default duration (4000 ms)", () => {
    const onDismiss = vi.fn();
    const toasts: Toast[] = [
      makeToast({ id: "t1", message: "Auto dismiss", duration: 4000 }),
    ];
    render(<ToastQueue toasts={toasts} onDismiss={onDismiss} />);
    expect(onDismiss).not.toHaveBeenCalled();
    act(() => {
      vi.advanceTimersByTime(4000);
    });
    expect(onDismiss).toHaveBeenCalledWith("t1");
  });

  it("respects a custom duration", () => {
    const onDismiss = vi.fn();
    const toasts: Toast[] = [
      makeToast({ id: "t1", message: "Custom", duration: 1500 }),
    ];
    render(<ToastQueue toasts={toasts} onDismiss={onDismiss} />);
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(onDismiss).not.toHaveBeenCalled();
    act(() => {
      vi.advanceTimersByTime(500);
    });
    expect(onDismiss).toHaveBeenCalledWith("t1");
  });

  // ---------------------------------------------------------------------------
  // Toast types render correctly
  // ---------------------------------------------------------------------------
  it("applies data-type=success to success toasts", () => {
    const toasts: Toast[] = [makeToast({ id: "t1", type: "success" })];
    render(<ToastQueue toasts={toasts} onDismiss={vi.fn()} />);
    expect(screen.getByTestId("toast-item-t1")).toHaveAttribute(
      "data-type",
      "success"
    );
  });

  it("applies data-type=error to error toasts", () => {
    const toasts: Toast[] = [makeToast({ id: "t1", type: "error" })];
    render(<ToastQueue toasts={toasts} onDismiss={vi.fn()} />);
    expect(screen.getByTestId("toast-item-t1")).toHaveAttribute(
      "data-type",
      "error"
    );
  });

  it("applies data-type=warning to warning toasts", () => {
    const toasts: Toast[] = [makeToast({ id: "t1", type: "warning" })];
    render(<ToastQueue toasts={toasts} onDismiss={vi.fn()} />);
    expect(screen.getByTestId("toast-item-t1")).toHaveAttribute(
      "data-type",
      "warning"
    );
  });

  it("applies data-type=info to info toasts", () => {
    const toasts: Toast[] = [makeToast({ id: "t1", type: "info" })];
    render(<ToastQueue toasts={toasts} onDismiss={vi.fn()} />);
    expect(screen.getByTestId("toast-item-t1")).toHaveAttribute(
      "data-type",
      "info"
    );
  });

  it("uses role=alert for error toasts", () => {
    const toasts: Toast[] = [makeToast({ id: "t1", type: "error" })];
    render(<ToastQueue toasts={toasts} onDismiss={vi.fn()} />);
    expect(screen.getByTestId("toast-item-t1")).toHaveAttribute("role", "alert");
  });

  it("uses role=status for info toasts", () => {
    const toasts: Toast[] = [makeToast({ id: "t1", type: "info" })];
    render(<ToastQueue toasts={toasts} onDismiss={vi.fn()} />);
    expect(screen.getByTestId("toast-item-t1")).toHaveAttribute(
      "role",
      "status"
    );
  });

  // ---------------------------------------------------------------------------
  // Max 5 visible
  // ---------------------------------------------------------------------------
  it("shows at most 5 toasts when the queue has more than 5", () => {
    const toasts: Toast[] = Array.from({ length: 8 }, (_, i) =>
      makeToast({ id: `t${i}`, message: `Toast ${i}` })
    );
    render(<ToastQueue toasts={toasts} onDismiss={vi.fn()} />);
    // Only the last 5 should be visible (indices 3–7)
    expect(screen.queryByTestId("toast-item-t0")).not.toBeInTheDocument();
    expect(screen.queryByTestId("toast-item-t1")).not.toBeInTheDocument();
    expect(screen.queryByTestId("toast-item-t2")).not.toBeInTheDocument();
    expect(screen.getByTestId("toast-item-t3")).toBeInTheDocument();
    expect(screen.getByTestId("toast-item-t7")).toBeInTheDocument();
  });

  it("shows exactly 5 toasts when there are exactly 5", () => {
    const toasts: Toast[] = Array.from({ length: 5 }, (_, i) =>
      makeToast({ id: `t${i}` })
    );
    render(<ToastQueue toasts={toasts} onDismiss={vi.fn()} />);
    for (let i = 0; i < 5; i++) {
      expect(screen.getByTestId(`toast-item-t${i}`)).toBeInTheDocument();
    }
  });
});

// ---------------------------------------------------------------------------
// useToastQueue hook
// ---------------------------------------------------------------------------

describe("useToastQueue", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
  });

  it("starts with an empty toasts array", () => {
    const { result } = renderHook(() => useToastQueue());
    expect(result.current.toasts).toHaveLength(0);
  });

  it("addToast appends a toast with the correct fields", () => {
    const { result } = renderHook(() => useToastQueue());
    act(() => {
      result.current.addToast("Save successful", "success");
    });
    expect(result.current.toasts).toHaveLength(1);
    expect(result.current.toasts[0].message).toBe("Save successful");
    expect(result.current.toasts[0].type).toBe("success");
  });

  it("addToast returns a unique id string", () => {
    const { result } = renderHook(() => useToastQueue());
    let id1 = "";
    let id2 = "";
    act(() => {
      id1 = result.current.addToast("First", "info");
      id2 = result.current.addToast("Second", "warning");
    });
    expect(id1).toBeTruthy();
    expect(id2).toBeTruthy();
    expect(id1).not.toBe(id2);
  });

  it("addToast stores the custom duration when provided", () => {
    const { result } = renderHook(() => useToastQueue());
    act(() => {
      result.current.addToast("Ephemeral", "info", 1000);
    });
    expect(result.current.toasts[0].duration).toBe(1000);
  });

  it("dismissToast removes the toast with the matching id", () => {
    const { result } = renderHook(() => useToastQueue());
    let id = "";
    act(() => {
      id = result.current.addToast("Dismiss me", "error");
    });
    expect(result.current.toasts).toHaveLength(1);
    act(() => {
      result.current.dismissToast(id);
    });
    expect(result.current.toasts).toHaveLength(0);
  });

  it("dismissToast ignores unknown ids without throwing", () => {
    const { result } = renderHook(() => useToastQueue());
    act(() => {
      result.current.addToast("Keep me", "success");
    });
    act(() => {
      result.current.dismissToast("non-existent-id");
    });
    expect(result.current.toasts).toHaveLength(1);
  });

  it("can queue more than 5 toasts (rendering limits are the component's concern)", () => {
    const { result } = renderHook(() => useToastQueue());
    act(() => {
      for (let i = 0; i < 7; i++) {
        result.current.addToast(`Toast ${i}`, "info");
      }
    });
    expect(result.current.toasts).toHaveLength(7);
  });
});
