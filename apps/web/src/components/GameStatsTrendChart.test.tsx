import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";
import { GameStatsTrendChart, type TrendDataPoint } from "./GameStatsTrendChart";

const POINTS: TrendDataPoint[] = [
  { label: "Mon", value: 10 },
  { label: "Tue", value: 25 },
  { label: "Wed", value: 40 },
  { label: "Thu", value: 70 },
];

describe("GameStatsTrendChart", () => {
  it("renders trend chart with data points and increasing trend", () => {
    render(<GameStatsTrendChart dataPoints={POINTS} metricLabel="Win Rate" />);
    expect(screen.getByRole("heading", { level: 3, name: /Win Rate/i })).toBeInTheDocument();
    expect(screen.getByText("Increasing")).toBeInTheDocument();
    expect(screen.getByText("Mon")).toBeInTheDocument();
    expect(screen.getByText("Thu")).toBeInTheDocument();
  });

  it("renders empty state when dataPoints is empty", () => {
    render(<GameStatsTrendChart dataPoints={[]} metricLabel="Activity" emptyLabel="No recent matches" />);
    expect(screen.getByText("No recent matches")).toBeInTheDocument();
  });
});
