import { describe, it, expect, vi, afterEach } from "vitest";
import React from "react";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { TerritoryDominationMap } from "./TerritoryDominationMap";
import type { Territory, Player } from "./types";

afterEach(() => cleanup());

const TERRITORIES: Territory[] = [
  { id: "t1", name: "North Reach", x: 0, y: 0, width: 100, height: 80, status: "neutral" },
  { id: "t2", name: "Iron Crest", x: 110, y: 0, width: 100, height: 80, ownerId: "p1", status: "owned" },
  { id: "t3", name: "Shadow Vale", x: 220, y: 0, width: 100, height: 80, status: "contested" },
  { id: "t4", name: "Void Keep", x: 330, y: 0, width: 100, height: 80, status: "locked" },
];

const PLAYERS: Player[] = [
  { id: "p1", username: "AlphaForce", color: "#3b82f6", territoriesOwned: 3, totalResources: 120 },
  { id: "p2", username: "OmegaClan", color: "#ef4444", territoriesOwned: 1, totalResources: 40 },
];

function makeProps(overrides: Partial<React.ComponentProps<typeof TerritoryDominationMap>> = {}) {
  return {
    territories: TERRITORIES,
    players: PLAYERS,
    ...overrides,
  };
}

describe("TerritoryDominationMap", () => {
  it("renders the SVG map", () => {
    render(<TerritoryDominationMap {...makeProps()} />);
    expect(screen.getByTestId("territory-map-svg")).toBeTruthy();
  });

  it("renders a sector for each territory", () => {
    render(<TerritoryDominationMap {...makeProps()} />);
    for (const t of TERRITORIES) {
      expect(screen.getByTestId(`territory-sector-${t.id}`)).toBeTruthy();
    }
  });

  it("renders territory labels", () => {
    render(<TerritoryDominationMap {...makeProps()} />);
    expect(screen.getByTestId("territory-label-t1").textContent).toBe("North Reach");
    expect(screen.getByTestId("territory-label-t2").textContent).toBe("Iron Crest");
  });

  it("calls onTerritoryClick when a non-locked territory is clicked", () => {
    const onTerritoryClick = vi.fn();
    render(<TerritoryDominationMap {...makeProps({ onTerritoryClick })} />);
    fireEvent.click(screen.getByTestId("territory-sector-t1"));
    expect(onTerritoryClick).toHaveBeenCalledWith("t1");
  });

  it("does not call onTerritoryClick when locked territory is clicked", () => {
    const onTerritoryClick = vi.fn();
    render(<TerritoryDominationMap {...makeProps({ onTerritoryClick })} />);
    fireEvent.click(screen.getByTestId("territory-sector-t4"));
    expect(onTerritoryClick).not.toHaveBeenCalled();
  });

  it("marks selected territory with aria-selected", () => {
    render(<TerritoryDominationMap {...makeProps({ selectedTerritoryId: "t1" })} />);
    expect(screen.getByTestId("territory-rect-t1").getAttribute("aria-selected")).toBe("true");
    expect(screen.getByTestId("territory-rect-t2").getAttribute("aria-selected")).toBe("false");
  });

  it("renders leaderboard sorted by territories owned", () => {
    render(<TerritoryDominationMap {...makeProps()} />);
    expect(screen.getByTestId("leaderboard")).toBeTruthy();
    const p1Row = screen.getByTestId("leaderboard-row-p1");
    const p2Row = screen.getByTestId("leaderboard-row-p2");
    expect(p1Row).toBeTruthy();
    expect(p2Row).toBeTruthy();
    expect(screen.getByTestId("leaderboard-name-p1").textContent).toBe("AlphaForce");
    expect(screen.getByTestId("leaderboard-territories-p1").textContent).toBe("3");
  });

  it("shows current player info when currentPlayerId provided", () => {
    render(<TerritoryDominationMap {...makeProps({ currentPlayerId: "p1" })} />);
    expect(screen.getByTestId("current-player-info")).toBeTruthy();
    expect(screen.getByTestId("current-player-name").textContent).toBe("AlphaForce");
  });

  it("does not show current player info when currentPlayerId not provided", () => {
    render(<TerritoryDominationMap {...makeProps()} />);
    expect(screen.queryByTestId("current-player-info")).toBeNull();
  });

  it("renders contested icon for contested territories", () => {
    render(<TerritoryDominationMap {...makeProps()} />);
    expect(screen.getByTestId("territory-contested-icon-t3")).toBeTruthy();
  });

  it("renders resource value when provided", () => {
    const withResources = TERRITORIES.map((t, i) => ({ ...t, resourceValue: (i + 1) * 10 }));
    render(<TerritoryDominationMap {...makeProps({ territories: withResources })} />);
    expect(screen.getByTestId("territory-resource-t1").textContent).toContain("10");
  });
});
