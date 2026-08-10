import { act, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ModalOverlay, ModalStackProvider } from "./modal-stack.js";

describe("ModalOverlay", () => {
  it("renders nothing when inactive", () => {
    render(
      <ModalStackProvider>
        <ModalOverlay active={false} modalId="m1">
          <button>content</button>
        </ModalOverlay>
      </ModalStackProvider>,
    );
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("renders as a dialog when active", () => {
    render(
      <ModalStackProvider>
        <ModalOverlay active={true} modalId="m1">
          <button>content</button>
        </ModalOverlay>
      </ModalStackProvider>,
    );
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByRole("dialog")).toHaveAttribute("aria-modal", "true");
  });

  it("calls onRequestClose when Escape is pressed on the top modal", async () => {
    const onRequestClose = vi.fn();
    render(
      <ModalStackProvider>
        <ModalOverlay active={true} modalId="m1" onRequestClose={onRequestClose}>
          <button>content</button>
        </ModalOverlay>
      </ModalStackProvider>,
    );

    await act(async () => {
      window.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true, cancelable: true }));
    });

    expect(onRequestClose).toHaveBeenCalledTimes(1);
  });

  it("only the top-of-stack modal's onRequestClose fires on Escape", async () => {
    const closeFirst = vi.fn();
    const closeSecond = vi.fn();

    function TwoModals() {
      return (
        <ModalStackProvider>
          <ModalOverlay active={true} modalId="first" onRequestClose={closeFirst}>
            <button>first</button>
          </ModalOverlay>
          <ModalOverlay active={true} modalId="second" onRequestClose={closeSecond}>
            <button>second</button>
          </ModalOverlay>
        </ModalStackProvider>
      );
    }

    render(<TwoModals />);

    await act(async () => {
      window.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true, cancelable: true }));
    });

    expect(closeFirst).not.toHaveBeenCalled();
    expect(closeSecond).toHaveBeenCalledTimes(1);
  });

  it("ignores non-Escape keys", async () => {
    const onRequestClose = vi.fn();
    render(
      <ModalStackProvider>
        <ModalOverlay active={true} modalId="m1" onRequestClose={onRequestClose}>
          <button>content</button>
        </ModalOverlay>
      </ModalStackProvider>,
    );

    await act(async () => {
      window.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true, cancelable: true }));
    });

    expect(onRequestClose).not.toHaveBeenCalled();
  });
});
