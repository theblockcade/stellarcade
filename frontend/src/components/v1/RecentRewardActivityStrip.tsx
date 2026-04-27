import React from "react";
import "./RecentRewardActivityStrip.css";

/**
 * Recent reward activity strip — issue #681.
 *
 * Shown on dashboard overview surfaces, this is a horizontally-scrollable
 * snapshot of the most recent rewards a player has received. The component
 * is purely presentational: callers fetch their own activity and pass it in.
 *
 * Handles all four lifecycle states explicitly (loading, empty, error,
 * populated) per the issue's "handle empty, loading, disabled, and missing
 * data states explicitly" requirement.
 */
export interface RecentRewardActivityItem {
  id: string;
  /** Pre-formatted amount string, e.g. "+250 STC" — keeps formatting concerns out of the strip. */
  amount: string;
  /** Source label, e.g. "Daily Trivia", "Mission #12". */
  source: string;
  /** ISO 8601 timestamp; rendered as a relative-time label. */
  timestamp: string;
}

export interface RecentRewardActivityStripProps {
  items: RecentRewardActivityItem[];
  isLoading?: boolean;
  errorMessage?: string;
  /** Override the human label rendered above the list. */
  title?: string;
  /** Number of skeleton rows to render while `isLoading`. */
  skeletonCount?: number;
  /** Optional `data-testid` override for the root element. */
  testId?: string;
  /** Optional clock injection so tests can pin "now" deterministically. */
  now?: Date;
}

const RELATIVE_THRESHOLDS: Array<{ ms: number; label: (n: number) => string }> = [
  { ms: 60_000, label: () => "just now" },
  { ms: 60 * 60_000, label: (n) => `${Math.floor(n / 60_000)}m ago` },
  { ms: 24 * 60 * 60_000, label: (n) => `${Math.floor(n / (60 * 60_000))}h ago` },
  { ms: 7 * 24 * 60 * 60_000, label: (n) => `${Math.floor(n / (24 * 60 * 60_000))}d ago` },
];

function formatRelative(timestamp: string, now: Date): string {
  const t = new Date(timestamp).getTime();
  if (Number.isNaN(t)) return timestamp;
  const delta = Math.max(0, now.getTime() - t);
  for (const tier of RELATIVE_THRESHOLDS) {
    if (delta < tier.ms) {
      return tier.label(delta);
    }
  }
  return new Date(timestamp).toLocaleDateString();
}

export const RecentRewardActivityStrip: React.FC<RecentRewardActivityStripProps> = ({
  items,
  isLoading = false,
  errorMessage,
  title = "Recent rewards",
  skeletonCount = 4,
  testId = "recent-reward-activity-strip",
  now = new Date(),
}) => {
  return (
    <section
      className="recent-reward-activity-strip"
      aria-label={title}
      data-testid={testId}
    >
      <header className="recent-reward-activity-strip__header">
        <h3 className="recent-reward-activity-strip__title">{title}</h3>
        {!isLoading && !errorMessage && items.length > 0 && (
          <span
            className="recent-reward-activity-strip__count"
            data-testid={`${testId}-count`}
          >
            {items.length} {items.length === 1 ? "reward" : "rewards"}
          </span>
        )}
      </header>

      {errorMessage ? (
        <div
          role="alert"
          className="recent-reward-activity-strip__error"
          data-testid={`${testId}-error`}
        >
          {errorMessage}
        </div>
      ) : isLoading ? (
        <div
          className="recent-reward-activity-strip__list"
          data-testid={`${testId}-loading`}
          aria-busy="true"
        >
          {Array.from({ length: skeletonCount }).map((_, i) => (
            <div
              key={i}
              className="recent-reward-activity-strip__skeleton"
              aria-hidden="true"
            />
          ))}
        </div>
      ) : items.length === 0 ? (
        <p
          className="recent-reward-activity-strip__empty"
          data-testid={`${testId}-empty`}
        >
          No rewards yet — start a game or complete a mission to see them here.
        </p>
      ) : (
        <ul
          className="recent-reward-activity-strip__list"
          data-testid={`${testId}-list`}
          role="list"
        >
          {items.map((item) => (
            <li
              key={item.id}
              className="recent-reward-activity-strip__item"
              data-testid={`${testId}-item-${item.id}`}
            >
              <span className="recent-reward-activity-strip__item-amount">
                {item.amount}
              </span>
              <span className="recent-reward-activity-strip__item-source">
                {item.source}
              </span>
              <time
                className="recent-reward-activity-strip__item-time"
                dateTime={item.timestamp}
                title={item.timestamp}
              >
                {formatRelative(item.timestamp, now)}
              </time>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
};

export default RecentRewardActivityStrip;
