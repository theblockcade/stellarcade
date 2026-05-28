import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import NotificationCenter from "../../../src/components/v1/NotificationCenter";
import { useErrorStore } from "../../../src/store/errorStore";

beforeEach(() => {
  useErrorStore.getState().clearToasts();
  useErrorStore.getState().clearToastHistory();
  useErrorStore.getState().clearDeferredToasts();
  useErrorStore.setState({
    current: null,
    history: [],
    toasts: [],
    deferredToasts: [],
    toastHistory: [],
  });
});

describe("NotificationCenter", () => {
  it("renders nothing when there are no notifications", () => {
    const { container } = render(<NotificationCenter />);
    expect(container).toBeEmptyDOMElement();
  });

  it("shows deferred notifications in the queued view", () => {
    for (let index = 0; index < 4; index += 1) {
      useErrorStore.getState().enqueueToast({
        tone: index % 2 === 0 ? "success" : "error",
        message: `toast-${index}`,
        durationMs: 60_000,
      });
    }

    render(<NotificationCenter />);
    fireEvent.click(screen.getByTestId("notification-center-view-deferred"));

    expect(screen.getByTestId("notification-center-deferred-list")).toHaveTextContent(
      "toast-3",
    );
  });

  it("renders a stable empty panel when showWhenEmpty is enabled", () => {
    render(<NotificationCenter showWhenEmpty />);

    expect(screen.getByTestId("notification-center")).toBeInTheDocument();
    expect(screen.getByTestId("notification-center-empty-panel")).toHaveTextContent(
      "No notifications yet",
    );
  });
});
