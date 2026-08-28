import { describe, it, expect, vi, afterEach } from "vitest";
import React from "react";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { TrophyShowcaseGrid } from "./TrophyShowcaseGrid";
import { computeProgressPercent } from "./TrophyCard";
import type { TrophyItem } from "./types";

afterEach(() => {
  cleanup();
});

function buildTrophy(overrides: Partial<TrophyItem> = {}): TrophyItem {
  return {
    id: "t1",
    title: "First Blood",
    description: "Win your first match",
    rarity: "bronze",
    status: "unlocked",
    unlockDate: "2026-01-01",
    rewardXp: 100,
    ...overrides,
  };
}

describe("computeProgressPercent", () => {
  it("computes a rounded percentage", () => {
    expect(computeProgressPercent(7, 10)).toBe(70);
  });

  it("caps at 100 even if current exceeds target", () => {
    expect(computeProgressPercent(15, 10)).toBe(100);
  });

  it("returns 0 for a zero or negative target", () => {
    expect(computeProgressPercent(5, 0)).toBe(0);
  });
});

describe("TrophyShowcaseGrid — rendering", () => {
  it("renders all trophies by default", () => {
    const trophies = [
      buildTrophy({ id: "t1", status: "unlocked" }),
      buildTrophy({ id: "t2", status: "locked" }),
      buildTrophy({ id: "t3", status: "in_progress" }),
    ];
    render(<TrophyShowcaseGrid trophies={trophies} />);
    expect(screen.getByTestId("trophy-card-t1")).toBeDefined();
    expect(screen.getByTestId("trophy-card-t2")).toBeDefined();
    expect(screen.getByTestId("trophy-card-t3")).toBeDefined();
  });

  it("shows an empty message when there are no trophies in a filtered category", () => {
    render(<TrophyShowcaseGrid trophies={[buildTrophy({ status: "unlocked" })]} />);
    fireEvent.click(screen.getByTestId("trophy-filter-tab-locked"));
    expect(screen.getByTestId("trophy-empty-message")).toBeDefined();
  });

  it("renders locked trophies with the grayscale class", () => {
    render(<TrophyShowcaseGrid trophies={[buildTrophy({ id: "t1", status: "locked" })]} />);
    expect(screen.getByTestId("trophy-card-t1").className).toContain("trophy-card--grayscale");
  });

  it("does not grayscale unlocked trophies", () => {
    render(<TrophyShowcaseGrid trophies={[buildTrophy({ id: "t1", status: "unlocked" })]} />);
    expect(screen.getByTestId("trophy-card-t1").className).not.toContain("trophy-card--grayscale");
  });
});

describe("TrophyShowcaseGrid — filtering by unlock status", () => {
  const trophies = [
    buildTrophy({ id: "t1", status: "unlocked" }),
    buildTrophy({ id: "t2", status: "locked" }),
    buildTrophy({ id: "t3", status: "in_progress" }),
  ];

  it("filters to only unlocked trophies", () => {
    render(<TrophyShowcaseGrid trophies={trophies} />);
    fireEvent.click(screen.getByTestId("trophy-filter-tab-unlocked"));
    expect(screen.getByTestId("trophy-card-t1")).toBeDefined();
    expect(screen.queryByTestId("trophy-card-t2")).toBeNull();
    expect(screen.queryByTestId("trophy-card-t3")).toBeNull();
  });

  it("filters to only locked trophies", () => {
    render(<TrophyShowcaseGrid trophies={trophies} />);
    fireEvent.click(screen.getByTestId("trophy-filter-tab-locked"));
    expect(screen.getByTestId("trophy-card-t2")).toBeDefined();
    expect(screen.queryByTestId("trophy-card-t1")).toBeNull();
  });

  it("filters to only in-progress trophies", () => {
    render(<TrophyShowcaseGrid trophies={trophies} />);
    fireEvent.click(screen.getByTestId("trophy-filter-tab-in_progress"));
    expect(screen.getByTestId("trophy-card-t3")).toBeDefined();
    expect(screen.queryByTestId("trophy-card-t1")).toBeNull();
  });

  it("returns to showing all trophies when 'All' is selected again", () => {
    render(<TrophyShowcaseGrid trophies={trophies} />);
    fireEvent.click(screen.getByTestId("trophy-filter-tab-locked"));
    fireEvent.click(screen.getByTestId("trophy-filter-tab-all"));
    expect(screen.getByTestId("trophy-card-t1")).toBeDefined();
    expect(screen.getByTestId("trophy-card-t2")).toBeDefined();
    expect(screen.getByTestId("trophy-card-t3")).toBeDefined();
  });

  it("marks the active filter tab with aria-pressed", () => {
    render(<TrophyShowcaseGrid trophies={trophies} />);
    fireEvent.click(screen.getByTestId("trophy-filter-tab-unlocked"));
    expect(screen.getByTestId("trophy-filter-tab-unlocked").getAttribute("aria-pressed")).toBe("true");
    expect(screen.getByTestId("trophy-filter-tab-all").getAttribute("aria-pressed")).toBe("false");
  });
});

describe("TrophyShowcaseGrid — locked trophy progress", () => {
  it("displays a progress bar and label for an in-progress trophy", () => {
    const trophy = buildTrophy({ id: "t1", status: "in_progress", progress: { current: 7, target: 10 } });
    render(<TrophyShowcaseGrid trophies={[trophy]} />);
    expect(screen.getByTestId("trophy-progress-label-t1").textContent).toBe("7/10");
    expect(screen.getByTestId("trophy-progress-bar-t1").style.width).toBe("70%");
  });

  it("does not render a progress bar for an unlocked trophy", () => {
    render(<TrophyShowcaseGrid trophies={[buildTrophy({ id: "t1", status: "unlocked" })]} />);
    expect(screen.queryByTestId("trophy-progress-t1")).toBeNull();
  });
});

describe("TrophyShowcaseGrid — selection", () => {
  it("calls onSelectTrophy with the clicked trophy's data", () => {
    const onSelectTrophy = vi.fn();
    const trophy = buildTrophy();
    render(<TrophyShowcaseGrid trophies={[trophy]} onSelectTrophy={onSelectTrophy} />);
    fireEvent.click(screen.getByTestId("trophy-card-t1"));
    expect(onSelectTrophy).toHaveBeenCalledWith(trophy);
  });
});

describe("TrophyShowcaseGrid — responsive columns", () => {
  it("applies the columns class based on the columns prop", () => {
    render(<TrophyShowcaseGrid trophies={[buildTrophy()]} columns={3} />);
    expect(screen.getByTestId("trophy-showcase-grid").className).toContain("trophy-showcase-grid--cols-3");
  });

  it("defaults to 4 columns", () => {
    render(<TrophyShowcaseGrid trophies={[buildTrophy()]} />);
    expect(screen.getByTestId("trophy-showcase-grid").className).toContain("trophy-showcase-grid--cols-4");
  });
});
