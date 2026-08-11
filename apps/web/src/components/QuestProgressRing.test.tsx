import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";
import { QuestProgressRing } from "./QuestProgressRing";

describe("QuestProgressRing", () => {
  it("renders circular progress bar with percentage and label", () => {
    render(
      <QuestProgressRing
        percentage={80}
        animate={false}
        label="8/10 Milestones"
        subtitle="Tier 2 Unlocked"
      />
    );
    const ring = screen.getByRole("progressbar");
    expect(ring).toHaveAttribute("aria-valuenow", "80");
    expect(screen.getByText("80%")).toBeInTheDocument();
    expect(screen.getByText("8/10 Milestones")).toBeInTheDocument();
    expect(screen.getByText("Tier 2 Unlocked")).toBeInTheDocument();
  });
});
