import React from "react";
import { TerritoryProgressBarProps } from "./types";

const SEGMENT_COLORS = ["#22c55e", "#3b82f6", "#f59e0b", "#ef4444", "#a855f7"];

/** Normalize territory percentages so they always sum to exactly 100 —
 * proportionally rescaling if the input is off (e.g. rounding drift from
 * an upstream source), so the bar never renders a visible gap or overflow. */
export function normalizeTerritoryShares(clans: { territoryControlPercent: number }[]): number[] {
  const total = clans.reduce((sum, c) => sum + c.territoryControlPercent, 0);
  if (total <= 0) return clans.map(() => 0);
  return clans.map((c) => (c.territoryControlPercent / total) * 100);
}

export const TerritoryProgressBar: React.FC<TerritoryProgressBarProps> = ({ clans }) => {
  const shares = normalizeTerritoryShares(clans);

  return (
    <div className="territory-progress-bar" data-testid="territory-progress-bar" role="img" aria-label="Territory control by clan">
      {clans.map((clan, i) => (
        <div
          key={clan.clanId}
          className="territory-progress-segment"
          style={{ width: `${shares[i]}%`, backgroundColor: SEGMENT_COLORS[i % SEGMENT_COLORS.length] }}
          data-testid={`territory-segment-${clan.clanId}`}
          title={`${clan.clanName}: ${clan.territoryControlPercent}%`}
        />
      ))}
    </div>
  );
};
