import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import StatusCard from "./StatusCard";

// StatusCard moved from CSS class-based tone/stale styling (tone-success,
// is-stale, etc.) to inline styles keyed off the same props — there are no
// tone-*/is-stale classes to assert on anymore, so these check the actual
// rendered values (border color, opacity, presence of the "Stale" text)
// instead.

describe("StatusCard", () => {
  it("renders basic info and uses a neutral border by default", () => {
    render(<StatusCard id="game-123456789" name="Test Game" status="active" wager={10} />);

    expect(screen.getByText("Test Game")).toBeDefined();
    expect(screen.getByText("#game-123")).toBeDefined();
    expect(screen.getByText("ACTIVE")).toBeDefined();
    expect(screen.getByText("10 XLM")).toBeDefined();

    // jsdom keeps var(...) expressions literal rather than resolving the
    // fallback value, so this asserts against the same string the browser
    // would receive before CSS resolves it, not the resolved color.
    const card = screen.getByTestId("status-card");
    expect(card.getAttribute("style")).toContain(
      "border: 1px solid var(--sc-border-glass, rgba(255, 255, 255, 0.1))",
    );
  });

  it("applies a semantic border color per tone", () => {
    const { rerender } = render(<StatusCard id="g1" name="N" status="S" tone="success" />);
    expect(screen.getByTestId("status-card").getAttribute("style")).toContain(
      "border: 1px solid rgba(0, 255, 204, 0.4)",
    );

    rerender(<StatusCard id="g1" name="N" status="S" tone="error" />);
    expect(screen.getByTestId("status-card").getAttribute("style")).toContain(
      "border: 1px solid rgba(239, 68, 68, 0.4)",
    );
  });

  it("renders content in before and after slots", () => {
    render(
      <StatusCard
        id="g1"
        name="N"
        status="S"
        beforeSlot={<span data-testid="before">PRE</span>}
        afterSlot={<span data-testid="after">POST</span>}
      />,
    );

    expect(screen.getByTestId("before")).toBeDefined();
    expect(screen.getByTestId("after")).toBeDefined();
  });

  it("renders a stale badge and dims the card when isStale is true", () => {
    render(<StatusCard id="g1" name="N" status="S" isStale={true} />);

    expect(screen.getByText("Stale")).toBeInTheDocument();

    const card = screen.getByTestId("status-card");
    expect(card).toHaveStyle({ opacity: "0.75" });
  });

  it("does not render the stale badge or dim the card by default", () => {
    render(<StatusCard id="g1" name="N" status="S" />);

    expect(screen.queryByText("Stale")).not.toBeInTheDocument();
    expect(screen.getByTestId("status-card")).toHaveStyle({ opacity: "1" });
  });
});
