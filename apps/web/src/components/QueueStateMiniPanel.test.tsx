import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";
import { QueueStateMiniPanel } from "./QueueStateMiniPanel";
import type { QueueMetrics } from "./QueueHealthWidget";

const METRICS: QueueMetrics = {
  playersInQueue: 8,
  averageWaitTime: 15,
  estimatedWaitTime: 10,
  activeMatches: 4,
  queueHealth: "healthy",
  lastUpdated: new Date().toISOString(),
};

describe("QueueStateMiniPanel", () => {
  it("renders queue mini panel with metrics and status", () => {
    render(<QueueStateMiniPanel metrics={METRICS} title="Coin Flip Lobby" />);
    expect(screen.getByText("Coin Flip Lobby")).toBeInTheDocument();
    expect(screen.getByText("8")).toBeInTheDocument();
    expect(screen.getByText("10s")).toBeInTheDocument();
    expect(screen.getByText("4")).toBeInTheDocument();
  });
});
