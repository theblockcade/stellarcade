import React from "react";
import { ActivityPillProps } from "./types";

export function formatTickerAmount(amount: number, asset: string): string {
  return `${amount.toLocaleString(undefined, { maximumFractionDigits: 2 })} ${asset}`;
}

export const ActivityPill: React.FC<ActivityPillProps> = ({ event, onSelect }) => {
  return (
    <button
      type="button"
      className={`activity-pill activity-pill--${event.type}${event.isHighValue ? " activity-pill--pulse" : ""}`}
      onClick={() => onSelect?.(event)}
      data-testid={`activity-pill-${event.id}`}
      data-type={event.type}
      data-high-value={Boolean(event.isHighValue)}
    >
      <span className="activity-pill-icon" aria-hidden="true">
        {event.gameIcon}
      </span>
      <span className="activity-pill-text">
        <strong className="activity-pill-handle">{event.playerHandle}</strong>{" "}
        {event.actionText}{" "}
        <span className="activity-pill-amount" data-testid={`activity-pill-amount-${event.id}`}>
          {formatTickerAmount(event.amount, event.asset)}
        </span>
      </span>
    </button>
  );
};
