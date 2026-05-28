/**
 * @vitest-environment happy-dom
 */

import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { describe, expect, it } from "vitest";
import { QueuePulseIndicator } from "@/components/v1/QueuePulseIndicator";

describe("QueuePulseIndicator", () => {
  it("renders the count and label in a live status region", () => {
    render(<QueuePulseIndicator count={12} label="Ranked" />);
    const region = screen.getByRole("status");
    expect(region).toHaveAttribute("aria-live", "polite");
    expect(region).toHaveAccessibleName(/Ranked: Live, 12 in queue/);
    expect(screen.getByTestId("queue-count")).toHaveTextContent("12");
  });

  it("derives 'live' for a non-empty queue and 'idle' when empty", () => {
    const { rerender } = render(<QueuePulseIndicator count={3} />);
    expect(screen.getByText("Live")).toBeInTheDocument();

    rerender(<QueuePulseIndicator count={0} />);
    expect(screen.getByText("Idle")).toBeInTheDocument();
    expect(screen.getByTestId("queue-count")).toHaveTextContent("0");
  });

  it("respects an explicit status (paused / offline)", () => {
    const { rerender } = render(
      <QueuePulseIndicator count={5} status="paused" />,
    );
    expect(screen.getByText("Paused")).toBeInTheDocument();

    rerender(<QueuePulseIndicator count={5} status="offline" />);
    expect(screen.getByText("Offline")).toBeInTheDocument();
  });

  it("renders a loading state", () => {
    render(<QueuePulseIndicator loading label="Ranked" />);
    const region = screen.getByRole("status");
    expect(region).toHaveAttribute("aria-busy", "true");
    expect(screen.queryByTestId("queue-count")).not.toBeInTheDocument();
  });

  it("defaults the count to 0 when omitted", () => {
    render(<QueuePulseIndicator />);
    expect(screen.getByTestId("queue-count")).toHaveTextContent("0");
    expect(screen.getByText("Idle")).toBeInTheDocument();
  });
});
