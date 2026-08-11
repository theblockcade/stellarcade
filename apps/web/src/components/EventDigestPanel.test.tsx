import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import React from "react";
import { EventDigestPanel, type DigestEvent } from "./EventDigestPanel";

const EVENTS: DigestEvent[] = [
  {
    id: "ev-1",
    type: "BET_PLACED",
    contractId: "CBBD47IF6LWK7P7M",
    timestamp: new Date().toISOString(),
    summary: "10 XLM on Coin Flip (Heads)",
    severity: "info",
  },
  {
    id: "ev-2",
    type: "SETTLEMENT",
    contractId: "CBBD47IF6LWK7P7M",
    timestamp: new Date().toISOString(),
    summary: "Outcome: Won 19.8 XLM",
    severity: "success",
  },
];

describe("EventDigestPanel", () => {
  it("renders list of events and clear all action", () => {
    const onClearAll = vi.fn();
    render(<EventDigestPanel events={EVENTS} status="success" onClearAll={onClearAll} />);

    expect(screen.getByText("Recent Activity")).toBeInTheDocument();
    expect(screen.getByText("BET_PLACED")).toBeInTheDocument();
    expect(screen.getByText("SETTLEMENT")).toBeInTheDocument();
    expect(screen.getByText("Outcome: Won 19.8 XLM")).toBeInTheDocument();

    const clearBtn = screen.getByTestId("event-digest-panel-clear");
    fireEvent.click(clearBtn);
    expect(onClearAll).toHaveBeenCalled();
  });
});
