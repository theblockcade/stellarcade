import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";
import { QueuePulseIndicator } from "./QueuePulseIndicator";

describe("QueuePulseIndicator", () => {
  it("renders count and live status label", () => {
    render(<QueuePulseIndicator count={5} status="live" label="Live Battles" />);
    expect(screen.getByText("Live Battles")).toBeInTheDocument();
    expect(screen.getByText("5")).toBeInTheDocument();
    expect(screen.getByText("Live")).toBeInTheDocument();
  });
});
