import React from "react";
import { StatusPill } from "./StatusPill";
import type { StatusToneVariant } from "../../types/status-tone";

export interface WalletSessionActivityItem {
  id: string;
  label: string;
  summary: string;
  detail?: string;
  timestampLabel?: string;
  tone?: StatusToneVariant;
}

export interface WalletSessionActivityRailProps {
  items: WalletSessionActivityItem[];
  emptyMessage?: string;
  testId?: string;
}

export function WalletSessionActivityRail({
  items,
  emptyMessage = "Session activity will appear here once the dashboard has something recent to summarize.",
  testId = "wallet-session-activity-rail",
}: WalletSessionActivityRailProps): React.JSX.Element {
  return (
    <aside
      className="wallet-session-activity-rail"
      aria-label="Wallet session activity"
      data-testid={testId}
    >
      <div className="wallet-session-activity-rail__header">
        <div>
          <p className="wallet-session-activity-rail__eyebrow">Activity rail</p>
          <h2 className="wallet-session-activity-rail__title">
            Recent wallet-session actions
          </h2>
        </div>
      </div>

      {items.length === 0 ? (
        <div
          className="wallet-session-activity-rail__empty"
          data-testid={`${testId}-empty`}
        >
          {emptyMessage}
        </div>
      ) : (
        <ol className="wallet-session-activity-rail__list">
          {items.map((item) => (
            <li
              key={item.id}
              className="wallet-session-activity-rail__item"
              data-testid={`${testId}-${item.id}`}
            >
              <div className="wallet-session-activity-rail__item-header">
                <strong>{item.label}</strong>
                <StatusPill
                  tone={item.tone ?? "neutral"}
                  label={item.timestampLabel ?? "Session"}
                  size="compact"
                />
              </div>
              <p className="wallet-session-activity-rail__summary">
                {item.summary}
              </p>
              {item.detail ? (
                <p className="wallet-session-activity-rail__detail">
                  {item.detail}
                </p>
              ) : null}
            </li>
          ))}
        </ol>
      )}
    </aside>
  );
}

export default WalletSessionActivityRail;
