import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import {
  RecentRewardActivityStrip,
  type RecentRewardActivityItem,
} from "@/components/v1/RecentRewardActivityStrip";

const items: RecentRewardActivityItem[] = [
  {
    id: "rw-1",
    amount: "+250 STC",
    source: "Daily Trivia",
    timestamp: "2026-04-26T11:55:00.000Z",
  },
  {
    id: "rw-2",
    amount: "+100 STC",
    source: "Mission #12",
    timestamp: "2026-04-26T10:00:00.000Z",
  },
];

const NOW = new Date("2026-04-26T12:00:00.000Z");

describe("RecentRewardActivityStrip (#681)", () => {
  it("renders one card per item with amount, source, and a relative timestamp", () => {
    render(<RecentRewardActivityStrip items={items} now={NOW} />);

    const list = screen.getByTestId("recent-reward-activity-strip-list");
    expect(list).toBeInTheDocument();

    const item1 = screen.getByTestId("recent-reward-activity-strip-item-rw-1");
    expect(item1).toHaveTextContent("+250 STC");
    expect(item1).toHaveTextContent("Daily Trivia");
    expect(item1).toHaveTextContent("5m ago");

    const item2 = screen.getByTestId("recent-reward-activity-strip-item-rw-2");
    expect(item2).toHaveTextContent("Mission #12");
    expect(item2).toHaveTextContent("2h ago");

    expect(screen.getByTestId("recent-reward-activity-strip-count")).toHaveTextContent(
      "2 rewards"
    );
  });

  it("singular count when there is exactly one item", () => {
    render(<RecentRewardActivityStrip items={[items[0]!]} now={NOW} />);
    expect(screen.getByTestId("recent-reward-activity-strip-count")).toHaveTextContent(
      "1 reward"
    );
  });

  it("renders the empty state when items is an empty array", () => {
    render(<RecentRewardActivityStrip items={[]} />);
    expect(screen.getByTestId("recent-reward-activity-strip-empty")).toBeInTheDocument();
    expect(
      screen.queryByTestId("recent-reward-activity-strip-list"),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByTestId("recent-reward-activity-strip-count"),
    ).not.toBeInTheDocument();
  });

  it("renders skeleton placeholders while loading", () => {
    render(<RecentRewardActivityStrip items={items} isLoading skeletonCount={3} />);
    const loading = screen.getByTestId("recent-reward-activity-strip-loading");
    expect(loading).toBeInTheDocument();
    expect(loading).toHaveAttribute("aria-busy", "true");
    expect(loading.children).toHaveLength(3);
    expect(
      screen.queryByTestId("recent-reward-activity-strip-list"),
    ).not.toBeInTheDocument();
  });

  it("renders an error fallback with role=alert when errorMessage is provided", () => {
    render(
      <RecentRewardActivityStrip items={items} errorMessage="failed to load rewards" />,
    );
    const error = screen.getByTestId("recent-reward-activity-strip-error");
    expect(error).toHaveTextContent("failed to load rewards");
    expect(error).toHaveAttribute("role", "alert");
    expect(
      screen.queryByTestId("recent-reward-activity-strip-list"),
    ).not.toBeInTheDocument();
  });

  it("falls back to the raw timestamp when the input is unparseable", () => {
    render(
      <RecentRewardActivityStrip
        items={[{ ...items[0]!, timestamp: "not-a-date" }]}
        now={NOW}
      />,
    );
    expect(
      screen.getByTestId("recent-reward-activity-strip-item-rw-1"),
    ).toHaveTextContent("not-a-date");
  });

  it("uses an overridden title for the section label", () => {
    render(
      <RecentRewardActivityStrip items={items} title="Today's wins" now={NOW} />,
    );
    expect(screen.getByLabelText("Today's wins")).toBeInTheDocument();
  });
});
