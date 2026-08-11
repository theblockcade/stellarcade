import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";
import { QuestProgressBar } from "./QuestProgressBar";

describe("QuestProgressBar", () => {
  it("renders with given percentage without animation", () => {
    render(<QuestProgressBar percentage={75} animate={false} label="3/4 milestones" />);
    const bar = screen.getByRole("progressbar");
    expect(bar).toHaveAttribute("aria-valuenow", "75");
    expect(screen.getByText("3/4 milestones")).toBeInTheDocument();
  });

  it("clamps percentage between 0 and 100", () => {
    render(<QuestProgressBar percentage={150} animate={false} />);
    const bar = screen.getByRole("progressbar");
    expect(bar).toHaveAttribute("aria-valuenow", "100");
  });
});
