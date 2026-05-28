import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { StateDisplay } from "../StateDisplay";

describe("StateDisplay", () => {
  it("renders empty state", () => {
    render(
      <StateDisplay
        state="empty"
        message="No data found"
      />
    );

    expect(screen.getByText("No data found")).toBeInTheDocument();
  });

  it("renders loading state with animation", () => {
    render(
      <StateDisplay
        state="loading"
        message="Loading..."
      />
    );

    expect(screen.getByText("Loading...")).toBeInTheDocument();
    const icon = screen.getByText("⟳");
    expect(icon).toHaveClass("animate-spin");
  });

  it("renders error state", () => {
    render(
      <StateDisplay
        state="error"
        message="Failed to load"
      />
    );

    expect(screen.getByText("Failed to load")).toBeInTheDocument();
  });

  it("renders disabled state", () => {
    render(
      <StateDisplay
        state="disabled"
        message="View is read-only"
      />
    );

    expect(screen.getByText("View is read-only")).toBeInTheDocument();
  });

  it("uses default messages when none provided", () => {
    const { rerender } = render(
      <StateDisplay state="empty" />
    );

    expect(screen.getByText("No metadata available")).toBeInTheDocument();

    rerender(<StateDisplay state="loading" />);
    expect(screen.getByText("Loading...")).toBeInTheDocument();

    rerender(<StateDisplay state="error" />);
    expect(screen.getByText("Failed to load metadata")).toBeInTheDocument();

    rerender(<StateDisplay state="disabled" />);
    expect(screen.getByText("View is read-only")).toBeInTheDocument();
  });

  it("renders custom icon", () => {
    render(
      <StateDisplay
        state="empty"
        icon={<span>🎮</span>}
      />
    );

    expect(screen.getByText("🎮")).toBeInTheDocument();
  });

  it("has proper accessibility attributes", () => {
    const { container } = render(
      <StateDisplay
        state="loading"
        message="Loading data..."
      />
    );

    const display = container.querySelector("[role='status']");
    expect(display).toHaveAttribute("aria-live", "polite");
  });

  it("applies correct state classes", () => {
    const states = ["empty", "loading", "error", "disabled"] as const;

    states.forEach((state) => {
      const { container, unmount } = render(
        <StateDisplay state={state} />
      );

      const display = container.querySelector(".state-display");
      expect(display).toHaveClass(`state-${state}`);

      unmount();
    });
  });
});
