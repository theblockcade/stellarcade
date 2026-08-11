import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";
import { RecentRewardActivityStrip } from "./RecentRewardActivityStrip";

describe("RecentRewardActivityStrip", () => {
  it("renders reward activity items", () => {
    render(
      <RecentRewardActivityStrip
        items={[
          {
            id: "r1",
            amount: "+50 XLM",
            source: "Daily Quest Complete",
            timestamp: new Date().toISOString(),
          },
        ]}
      />
    );

    expect(screen.getByText("+50 XLM")).toBeInTheDocument();
    expect(screen.getByText("Daily Quest Complete")).toBeInTheDocument();
    expect(screen.getByText("1 reward")).toBeInTheDocument();
  });
});
