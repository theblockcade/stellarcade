import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";
import { QueueHealthWidget, type QueueMetrics } from "./QueueHealthWidget";

const METRICS: QueueMetrics = {
  playersInQueue: 14,
  averageWaitTime: 12,
  estimatedWaitTime: 8,
  activeMatches: 6,
  queueHealth: "healthy",
  lastUpdated: new Date().toISOString(),
};

describe("QueueHealthWidget", () => {
  it("renders queue name and metrics", () => {
    render(<QueueHealthWidget metrics={METRICS} queueName="Coin Flip Matchmaking" />);
    expect(screen.getByText("Coin Flip Matchmaking")).toBeInTheDocument();
    expect(screen.getByText("Healthy")).toBeInTheDocument();
    expect(screen.getByText("14")).toBeInTheDocument();
    expect(screen.getByText("8s")).toBeInTheDocument();
  });
});