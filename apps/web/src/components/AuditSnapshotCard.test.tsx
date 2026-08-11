import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import React from "react";
import { AuditSnapshotCard, type AuditSnapshot } from "./AuditSnapshotCard";

const MOCK_AUDIT: AuditSnapshot = {
  id: "audit-01",
  timestamp: new Date().toISOString(),
  action: "Settle Coin Flip Round",
  actor: "Arbiter 0x1A",
  status: "success",
  details: {
    roundId: "round-1029",
    ledgerSeq: 490212,
  },
};

describe("AuditSnapshotCard", () => {
  it("renders audit action, actor, and status", () => {
    render(<AuditSnapshotCard audit={MOCK_AUDIT} expandable={true} />);
    expect(screen.getByText("Settle Coin Flip Round")).toBeInTheDocument();
    expect(screen.getByText("by Arbiter 0x1A")).toBeInTheDocument();

    const toggle = screen.getByTestId("audit-snapshot-card-expand-toggle");
    fireEvent.click(toggle);

    expect(screen.getByTestId("audit-snapshot-card-details")).toBeInTheDocument();
    expect(screen.getByText("round-1029")).toBeInTheDocument();
  });
});
