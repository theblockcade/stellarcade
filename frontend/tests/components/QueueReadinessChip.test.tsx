/**
 * @vitest-environment happy-dom
 */

import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { describe, expect, it } from "vitest";
import QueueReadinessChip from "@/components/v1/QueueReadinessChip";

describe("QueueReadinessChip (#832)", () => {
  it("renders the default label + state-tone class for each state", () => {
    const { rerender } = render(<QueueReadinessChip state="idle" testId="c" />);
    expect(screen.getByTestId("c")).toHaveClass("queue-readiness-chip--idle");
    expect(screen.getByText("Queue open")).toBeInTheDocument();

    rerender(<QueueReadinessChip state="forming" testId="c" />);
    expect(screen.getByTestId("c")).toHaveClass("queue-readiness-chip--forming");

    rerender(<QueueReadinessChip state="ready" testId="c" />);
    expect(screen.getByTestId("c")).toHaveClass("queue-readiness-chip--ready");

    rerender(<QueueReadinessChip state="disabled" testId="c" />);
    expect(screen.getByTestId("c")).toHaveClass("queue-readiness-chip--disabled");

    rerender(<QueueReadinessChip state="unavailable" testId="c" />);
    expect(screen.getByTestId("c")).toHaveClass("queue-readiness-chip--unavailable");
  });

  it("surfaces the waiting count for forming/idle when >0", () => {
    render(<QueueReadinessChip state="forming" queuedCount={3} testId="c" />);
    expect(screen.getByText("3")).toBeInTheDocument();
  });

  it("does not surface the waiting count on terminal states", () => {
    render(<QueueReadinessChip state="ready" queuedCount={5} testId="c" />);
    expect(screen.queryByText("5")).toBeNull();
  });

  it("uses a custom label when provided", () => {
    render(<QueueReadinessChip state="ready" label="Drop in now" />);
    expect(screen.getByText("Drop in now")).toBeInTheDocument();
  });

  it("hides the visible label when iconOnly is true but still announces via aria-label", () => {
    render(<QueueReadinessChip state="ready" iconOnly testId="c" />);
    expect(screen.queryByText("Match ready")).toBeNull();
    expect(screen.getByTestId("c")).toHaveAttribute(
      "aria-label",
      expect.stringContaining("Match ready")
    );
  });

  it("uses role=status with polite live region for state changes", () => {
    render(<QueueReadinessChip state="idle" testId="c" />);
    expect(screen.getByTestId("c")).toHaveAttribute("role", "status");
    expect(screen.getByTestId("c")).toHaveAttribute("aria-live", "polite");
  });
});
