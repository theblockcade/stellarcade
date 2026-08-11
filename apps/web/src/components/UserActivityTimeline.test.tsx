import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";
import { UserActivityTimeline, type UserActivity } from "./UserActivityTimeline";

const ACTIVITIES: UserActivity[] = [
  {
    id: "act-1",
    type: "deposit",
    title: "Deposited 50 XLM",
    description: "Account funded via Freighter",
    timestamp: new Date().toISOString(),
    status: "success",
  },
  {
    id: "act-2",
    type: "claim_reward",
    title: "Claimed 100 CADE",
    description: "Daily quest milestone 1",
    timestamp: new Date().toISOString(),
    status: "success",
  },
];

describe("UserActivityTimeline", () => {
  it("renders activities in timeline format", () => {
    render(<UserActivityTimeline activities={ACTIVITIES} />);
    expect(screen.getByText("Recent Activity")).toBeInTheDocument();
    expect(screen.getByText("Deposited 50 XLM")).toBeInTheDocument();
    expect(screen.getByText("Claimed 100 CADE")).toBeInTheDocument();
  });

  it("renders empty message when no activities are provided", () => {
    render(<UserActivityTimeline activities={[]} />);
    expect(screen.getByText("No activity recorded yet.")).toBeInTheDocument();
  });
});
