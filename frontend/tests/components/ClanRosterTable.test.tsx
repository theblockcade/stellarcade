/**
 * @vitest-environment happy-dom
 */

import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { describe, expect, it } from "vitest";
import { ClanRosterTable, type ClanMember } from "@/components/ClanRosterTable";

const mockMembers: ClanMember[] = [
  {
    address: "GABCDE1234567890WXYZ",
    role: "owner",
    joinedAt: "2024-01-15T10:00:00Z",
    isActive: true,
  },
  {
    address: "GXYZ9876543210ABCD",
    role: "member",
    joinedAt: "2024-03-22T08:30:00Z",
    isActive: true,
  },
  {
    address: "GFGHIJ5555555555KL",
    role: "member",
    joinedAt: "2024-06-01T12:00:00Z",
    isActive: false,
  },
];

describe("ClanRosterTable (#937)", () => {
  // ---------------------------------------------------------------------------
  // Empty state
  // ---------------------------------------------------------------------------
  it("renders the default empty message when members array is empty", () => {
    render(<ClanRosterTable clanId="clan-1" members={[]} />);
    expect(screen.getByTestId("clan-roster-empty")).toBeInTheDocument();
    expect(screen.getByText("No active members")).toBeInTheDocument();
  });

  it("renders a custom empty message when provided", () => {
    render(
      <ClanRosterTable
        clanId="clan-1"
        members={[]}
        emptyMessage="This clan has no members yet"
      />
    );
    expect(screen.getByText("This clan has no members yet")).toBeInTheDocument();
  });

  it("empty state has role=status for accessibility", () => {
    render(<ClanRosterTable clanId="clan-1" members={[]} />);
    expect(screen.getByRole("status")).toBeInTheDocument();
  });

  // ---------------------------------------------------------------------------
  // Loading state
  // ---------------------------------------------------------------------------
  it("renders a loading indicator when isLoading is true", () => {
    render(<ClanRosterTable clanId="clan-1" members={[]} isLoading />);
    expect(screen.getByTestId("clan-roster-loading")).toBeInTheDocument();
  });

  it("does not render the table when loading", () => {
    render(<ClanRosterTable clanId="clan-1" members={mockMembers} isLoading />);
    expect(screen.queryByTestId("clan-roster-table")).not.toBeInTheDocument();
  });

  it("loading state has role=status and aria-live=polite", () => {
    render(<ClanRosterTable clanId="clan-1" members={[]} isLoading />);
    const el = screen.getByRole("status");
    expect(el).toHaveAttribute("aria-live", "polite");
  });

  // ---------------------------------------------------------------------------
  // Member rows
  // ---------------------------------------------------------------------------
  it("renders a row for each member", () => {
    render(<ClanRosterTable clanId="clan-1" members={mockMembers} />);
    expect(screen.getByTestId("clan-roster-row-0")).toBeInTheDocument();
    expect(screen.getByTestId("clan-roster-row-1")).toBeInTheDocument();
    expect(screen.getByTestId("clan-roster-row-2")).toBeInTheDocument();
  });

  it("renders column headers", () => {
    render(<ClanRosterTable clanId="clan-1" members={mockMembers} />);
    expect(screen.getByText("Address")).toBeInTheDocument();
    expect(screen.getByText("Role")).toBeInTheDocument();
    expect(screen.getByText("Joined")).toBeInTheDocument();
    expect(screen.getByText("Status")).toBeInTheDocument();
  });

  it("renders owner and member role badges", () => {
    render(<ClanRosterTable clanId="clan-1" members={mockMembers} />);
    expect(screen.getByText("Owner")).toBeInTheDocument();
    const memberBadges = screen.getAllByText("Member");
    expect(memberBadges.length).toBeGreaterThanOrEqual(1);
  });

  // ---------------------------------------------------------------------------
  // Truncated addresses
  // ---------------------------------------------------------------------------
  it("shows truncated address (first6...last4) for long addresses", () => {
    render(<ClanRosterTable clanId="clan-1" members={mockMembers} />);
    // "GABCDE1234567890WXYZ" → "GABCDE...WXYZ"
    expect(screen.getByText("GABCDE...WXYZ")).toBeInTheDocument();
  });

  it("sets the full address in the title attribute for tooltip access", () => {
    render(<ClanRosterTable clanId="clan-1" members={mockMembers} />);
    const addressEl = screen.getByTestId("clan-roster-address-0");
    expect(addressEl).toHaveAttribute("title", "GABCDE1234567890WXYZ");
  });

  it("does not truncate short addresses", () => {
    const shortMember: ClanMember = {
      address: "GABC",
      role: "member",
      joinedAt: "2024-01-01T00:00:00Z",
      isActive: true,
    };
    render(<ClanRosterTable clanId="clan-1" members={[shortMember]} />);
    expect(screen.getByText("GABC")).toBeInTheDocument();
  });

  // ---------------------------------------------------------------------------
  // Inactive members
  // ---------------------------------------------------------------------------
  it("renders Active badge for active members", () => {
    render(<ClanRosterTable clanId="clan-1" members={mockMembers} />);
    const activeBadges = screen.getAllByText("Active");
    expect(activeBadges.length).toBe(2);
  });

  it("renders Inactive badge for inactive members", () => {
    render(<ClanRosterTable clanId="clan-1" members={mockMembers} />);
    expect(screen.getByText("Inactive")).toBeInTheDocument();
  });

  it("inactive member row carries an aria-label indicating inactive status", () => {
    render(<ClanRosterTable clanId="clan-1" members={mockMembers} />);
    const inactiveRow = screen.getByTestId("clan-roster-row-2");
    expect(inactiveRow.getAttribute("aria-label")).toMatch(/inactive/i);
  });

  // ---------------------------------------------------------------------------
  // clanId data attribute
  // ---------------------------------------------------------------------------
  it("exposes clanId as a data attribute on the table wrapper", () => {
    render(<ClanRosterTable clanId="clan-42" members={mockMembers} />);
    const table = screen.getByTestId("clan-roster-table");
    expect(table).toHaveAttribute("data-clan-id", "clan-42");
  });
});
