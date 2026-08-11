import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";
import { QueueReadinessChip } from "./QueueReadinessChip";

describe("QueueReadinessChip", () => {
  it("renders forming state and queued count", () => {
    render(<QueueReadinessChip state="forming" queuedCount={3} />);
    expect(screen.getByText("Filling")).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();
  });

  it("renders ready state", () => {
    render(<QueueReadinessChip state="ready" />);
    expect(screen.getByText("Match ready")).toBeInTheDocument();
  });
});
