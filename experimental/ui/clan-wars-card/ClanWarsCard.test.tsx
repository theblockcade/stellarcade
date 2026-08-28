import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";
import React from "react";
import { render, screen, fireEvent, cleanup, act } from "@testing-library/react";
import { ClanWarsCard, computeCountdown, formatCountdown } from "./ClanWarsCard";
import { normalizeTerritoryShares } from "./TerritoryProgressBar";
import type { ClanStanding } from "./types";

afterEach(() => {
  cleanup();
});

function buildClan(overrides: Partial<ClanStanding> = {}): ClanStanding {
  return {
    clanId: "c1",
    clanName: "Dragon Slayers",
    badgeIcon: "🐉",
    memberCount: 50,
    territoryControlPercent: 20,
    ...overrides,
  };
}

function buildClans(count: number): ClanStanding[] {
  return Array.from({ length: count }, (_, i) =>
    buildClan({
      clanId: `c${i + 1}`,
      clanName: `Clan ${i + 1}`,
      territoryControlPercent: (count - i) * 5,
    }),
  );
}

describe("computeCountdown", () => {
  it("computes days/hours/minutes/seconds remaining", () => {
    const now = new Date("2026-01-01T00:00:00Z").getTime();
    const endsAt = new Date("2026-01-04T14:30:00Z").toISOString();
    const parts = computeCountdown(endsAt, now);
    expect(parts.days).toBe(3);
    expect(parts.hours).toBe(14);
    expect(parts.minutes).toBe(30);
  });

  it("floors at zero once the season has ended", () => {
    const now = new Date("2026-01-05T00:00:00Z").getTime();
    const endsAt = new Date("2026-01-01T00:00:00Z").toISOString();
    const parts = computeCountdown(endsAt, now);
    expect(parts.days).toBe(0);
    expect(parts.hours).toBe(0);
    expect(parts.minutes).toBe(0);
    expect(parts.seconds).toBe(0);
  });
});

describe("formatCountdown", () => {
  it("formats as '{d}d {h}h {m}m'", () => {
    expect(formatCountdown({ days: 3, hours: 14, minutes: 30, seconds: 0 })).toBe("3d 14h 30m");
  });
});

describe("normalizeTerritoryShares", () => {
  it("returns shares unchanged when they already sum to 100", () => {
    const clans = [{ territoryControlPercent: 60 }, { territoryControlPercent: 40 }];
    expect(normalizeTerritoryShares(clans)).toEqual([60, 40]);
  });

  it("proportionally rescales when the input does not sum to 100", () => {
    const clans = [{ territoryControlPercent: 30 }, { territoryControlPercent: 30 }];
    const shares = normalizeTerritoryShares(clans);
    expect(shares[0] + shares[1]).toBeCloseTo(100, 5);
    expect(shares[0]).toBeCloseTo(50, 5);
  });

  it("returns all zeros when total territory is zero", () => {
    const clans = [{ territoryControlPercent: 0 }, { territoryControlPercent: 0 }];
    expect(normalizeTerritoryShares(clans)).toEqual([0, 0]);
  });
});

describe("ClanWarsCard — rendering standings", () => {
  it("renders the top 5 clans ranked by territory control", () => {
    const clans = buildClans(7);
    render(
      <ClanWarsCard clans={clans} seasonEndsAt={new Date(Date.now() + 100000).toISOString()} prizePoolXlm={1000} />,
    );
    const standings = screen.getByTestId("clan-wars-standings");
    expect(standings.children).toHaveLength(5);
    expect(screen.getByTestId("clan-standing-c1").getAttribute("data-rank")).toBe("1");
  });

  it("highlights the user's own clan when it is within the top 5", () => {
    const clans = buildClans(5);
    render(
      <ClanWarsCard
        clans={clans}
        userClanId="c3"
        seasonEndsAt={new Date(Date.now() + 100000).toISOString()}
        prizePoolXlm={1000}
      />,
    );
    expect(screen.getByTestId("clan-standing-c3").className).toContain("clan-standing-row--user");
  });

  it("pins the user's clan below the top 5 when it is outside it", () => {
    const clans = buildClans(8);
    render(
      <ClanWarsCard
        clans={clans}
        userClanId="c8"
        seasonEndsAt={new Date(Date.now() + 100000).toISOString()}
        prizePoolXlm={1000}
      />,
    );
    const standings = screen.getByTestId("clan-wars-standings");
    expect(standings.children).toHaveLength(5);
    const pinned = screen.getByTestId("clan-standing-c8");
    expect(pinned.className).toContain("clan-standing-row--pinned");
    expect(pinned.getAttribute("data-rank")).toBe("8");
  });

  it("does not render a pinned row when the user has no clan", () => {
    render(
      <ClanWarsCard
        clans={buildClans(8)}
        seasonEndsAt={new Date(Date.now() + 100000).toISOString()}
        prizePoolXlm={1000}
      />,
    );
    for (let i = 6; i <= 8; i++) {
      expect(screen.queryByTestId(`clan-standing-c${i}`)).toBeNull();
    }
  });
});

describe("ClanWarsCard — territory dominance bar", () => {
  it("renders one segment per top-5 clan summing proportionally to 100%", () => {
    const clans = buildClans(5);
    render(
      <ClanWarsCard clans={clans} seasonEndsAt={new Date(Date.now() + 100000).toISOString()} prizePoolXlm={1000} />,
    );
    const bar = screen.getByTestId("territory-progress-bar");
    expect(bar.children).toHaveLength(5);
  });
});

describe("ClanWarsCard — season countdown", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("updates the countdown display over time", () => {
    const seasonEndsAt = new Date(Date.now() + 3 * 86400 * 1000 + 3600 * 1000).toISOString();
    render(
      <ClanWarsCard clans={buildClans(3)} seasonEndsAt={seasonEndsAt} prizePoolXlm={1000} />,
    );
    const before = screen.getByTestId("clan-wars-countdown").textContent;

    act(() => {
      vi.advanceTimersByTime(65_000);
    });

    const after = screen.getByTestId("clan-wars-countdown").textContent;
    expect(after).not.toBe(before);
  });
});

describe("ClanWarsCard — prize pool and contribute", () => {
  it("displays the prize pool amount", () => {
    render(
      <ClanWarsCard
        clans={buildClans(3)}
        seasonEndsAt={new Date(Date.now() + 100000).toISOString()}
        prizePoolXlm={50000}
      />,
    );
    expect(screen.getByTestId("clan-wars-prize-pool").textContent).toBe("50,000 XLM prize pool");
  });

  it("calls onContribute when the Contribute Points button is clicked", () => {
    const onContribute = vi.fn();
    render(
      <ClanWarsCard
        clans={buildClans(3)}
        seasonEndsAt={new Date(Date.now() + 100000).toISOString()}
        prizePoolXlm={1000}
        onContribute={onContribute}
      />,
    );
    fireEvent.click(screen.getByTestId("clan-contribute-button"));
    expect(onContribute).toHaveBeenCalledTimes(1);
  });

  it("does not render a contribute button when onContribute is not provided", () => {
    render(
      <ClanWarsCard clans={buildClans(3)} seasonEndsAt={new Date(Date.now() + 100000).toISOString()} prizePoolXlm={1000} />,
    );
    expect(screen.queryByTestId("clan-contribute-button")).toBeNull();
  });
});
