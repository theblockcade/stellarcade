import { describe, it, expect, vi, afterEach } from "vitest";
import React from "react";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { LiveActivityTicker } from "./LiveActivityTicker";
import { formatTickerAmount } from "./ActivityPill";
import type { TickerEvent } from "./types";

afterEach(() => {
  cleanup();
});

function buildEvent(overrides: Partial<TickerEvent> = {}): TickerEvent {
  return {
    id: "evt-1",
    type: "win",
    gameIcon: "🪙",
    playerHandle: "@cryptoking",
    actionText: "won",
    amount: 25,
    asset: "XLM",
    ...overrides,
  };
}

describe("formatTickerAmount", () => {
  it("formats an amount with its asset symbol", () => {
    expect(formatTickerAmount(25, "XLM")).toBe("25 XLM");
  });

  it("caps decimal places at 2", () => {
    expect(formatTickerAmount(25.4567, "USDC")).toBe("25.46 USDC");
  });
});

describe("LiveActivityTicker — empty state", () => {
  it("renders a fallback message when the events list is empty", () => {
    render(<LiveActivityTicker events={[]} />);
    expect(screen.getByTestId("live-activity-ticker-empty")).toBeDefined();
    expect(screen.queryByTestId("live-activity-ticker")).toBeNull();
  });
});

describe("LiveActivityTicker — rendering event types", () => {
  it("renders win, wager, and jackpot event pills", () => {
    const events: TickerEvent[] = [
      buildEvent({ id: "e1", type: "win" }),
      buildEvent({ id: "e2", type: "wager", actionText: "wagered" }),
      buildEvent({ id: "e3", type: "jackpot", actionText: "hit the jackpot", isHighValue: true }),
    ];
    render(<LiveActivityTicker events={events} />);

    expect(screen.getAllByTestId("activity-pill-e1")[0].getAttribute("data-type")).toBe("win");
    expect(screen.getAllByTestId("activity-pill-e2")[0].getAttribute("data-type")).toBe("wager");
    expect(screen.getAllByTestId("activity-pill-e3")[0].getAttribute("data-type")).toBe("jackpot");
  });

  it("marks a high-value jackpot event as pulsing", () => {
    render(<LiveActivityTicker events={[buildEvent({ id: "e1", isHighValue: true })]} />);
    expect(screen.getAllByTestId("activity-pill-e1")[0].getAttribute("data-high-value")).toBe("true");
    expect(screen.getAllByTestId("activity-pill-e1")[0].className).toContain("activity-pill--pulse");
  });

  it("does not pulse a normal-value event", () => {
    render(<LiveActivityTicker events={[buildEvent({ id: "e1", isHighValue: false })]} />);
    expect(screen.getAllByTestId("activity-pill-e1")[0].className).not.toContain("activity-pill--pulse");
  });
});

describe("LiveActivityTicker — pause on hover", () => {
  it("pauses the marquee track on mouse enter and resumes on mouse leave", () => {
    render(<LiveActivityTicker events={[buildEvent()]} />);
    const ticker = screen.getByTestId("live-activity-ticker");
    const track = screen.getByTestId("live-activity-ticker-track");

    expect(track.getAttribute("data-paused")).toBe("false");
    fireEvent.mouseEnter(ticker);
    expect(track.getAttribute("data-paused")).toBe("true");
    fireEvent.mouseLeave(ticker);
    expect(track.getAttribute("data-paused")).toBe("false");
  });
});

describe("LiveActivityTicker — selecting an event", () => {
  it("calls onSelectEvent with the event's metadata when a pill is clicked", () => {
    const onSelectEvent = vi.fn();
    const event = buildEvent();
    render(<LiveActivityTicker events={[event]} onSelectEvent={onSelectEvent} />);

    fireEvent.click(screen.getAllByTestId("activity-pill-evt-1")[0]);
    expect(onSelectEvent).toHaveBeenCalledWith(event);
  });
});

describe("LiveActivityTicker — speed", () => {
  it("applies a longer animation duration for 'slow' than 'fast'", () => {
    const { rerender } = render(<LiveActivityTicker events={[buildEvent()]} speed="slow" />);
    const slowDuration = screen.getByTestId("live-activity-ticker-track").style.animationDuration;

    rerender(<LiveActivityTicker events={[buildEvent()]} speed="fast" />);
    const fastDuration = screen.getByTestId("live-activity-ticker-track").style.animationDuration;

    expect(parseFloat(slowDuration)).toBeGreaterThan(parseFloat(fastDuration));
  });

  it("defaults to 'normal' speed when none is given", () => {
    render(<LiveActivityTicker events={[buildEvent()]} />);
    expect(screen.getByTestId("live-activity-ticker-track").style.animationDuration).toBe("35s");
  });
});
