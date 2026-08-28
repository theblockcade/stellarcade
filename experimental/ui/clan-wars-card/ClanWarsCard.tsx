import React, { useEffect, useState } from "react";
import { ClanWarsCardProps } from "./types";
import { TerritoryProgressBar } from "./TerritoryProgressBar";

const TOP_STANDINGS_COUNT = 5;

export interface CountdownParts {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

/** Compute the remaining time until `endsAt`, floored at zero (never
 * negative once the season has ended). */
export function computeCountdown(endsAt: string, now: number = Date.now()): CountdownParts {
  const remainingMs = Math.max(0, new Date(endsAt).getTime() - now);
  const totalSeconds = Math.floor(remainingMs / 1000);
  return {
    days: Math.floor(totalSeconds / 86400),
    hours: Math.floor((totalSeconds % 86400) / 3600),
    minutes: Math.floor((totalSeconds % 3600) / 60),
    seconds: totalSeconds % 60,
  };
}

export function formatCountdown(parts: CountdownParts): string {
  return `${parts.days}d ${parts.hours}h ${parts.minutes}m`;
}

export const ClanWarsCard: React.FC<ClanWarsCardProps> = ({
  clans,
  userClanId,
  seasonEndsAt,
  prizePoolXlm,
  onContribute,
}) => {
  const [countdown, setCountdown] = useState<CountdownParts>(() => computeCountdown(seasonEndsAt));

  useEffect(() => {
    const interval = setInterval(() => {
      setCountdown(computeCountdown(seasonEndsAt));
    }, 1000);
    return () => clearInterval(interval);
  }, [seasonEndsAt]);

  const sortedClans = [...clans].sort((a, b) => b.territoryControlPercent - a.territoryControlPercent);
  const topFive = sortedClans.slice(0, TOP_STANDINGS_COUNT);
  const userClan = sortedClans.find((c) => c.clanId === userClanId);
  const userClanRank = userClan ? sortedClans.indexOf(userClan) + 1 : null;
  const userClanInTopFive = userClanRank !== null && userClanRank <= TOP_STANDINGS_COUNT;

  return (
    <div className="clan-wars-card" data-testid="clan-wars-card">
      <div className="clan-wars-header">
        <h2>Clan Wars</h2>
        <span className="clan-wars-countdown" data-testid="clan-wars-countdown">
          {formatCountdown(countdown)} remaining
        </span>
        <span className="clan-wars-prize-pool" data-testid="clan-wars-prize-pool">
          {prizePoolXlm.toLocaleString()} XLM prize pool
        </span>
      </div>

      <TerritoryProgressBar clans={topFive} />

      <ol className="clan-wars-standings" data-testid="clan-wars-standings">
        {topFive.map((clan, i) => (
          <li
            key={clan.clanId}
            className={`clan-standing-row${clan.clanId === userClanId ? " clan-standing-row--user" : ""}`}
            data-testid={`clan-standing-${clan.clanId}`}
            data-rank={i + 1}
          >
            <span className="clan-rank">#{i + 1}</span>
            <span className="clan-badge" aria-hidden="true">
              {clan.badgeIcon}
            </span>
            <span className="clan-name">{clan.clanName}</span>
            <span className="clan-member-count">{clan.memberCount} members</span>
            <span className="clan-territory-percent" data-testid={`clan-territory-percent-${clan.clanId}`}>
              {clan.territoryControlPercent}%
            </span>
          </li>
        ))}
      </ol>

      {userClan && !userClanInTopFive && (
        <div
          className="clan-standing-row clan-standing-row--user clan-standing-row--pinned"
          data-testid={`clan-standing-${userClan.clanId}`}
          data-rank={userClanRank}
        >
          <span className="clan-rank">#{userClanRank}</span>
          <span className="clan-badge" aria-hidden="true">
            {userClan.badgeIcon}
          </span>
          <span className="clan-name">{userClan.clanName}</span>
          <span className="clan-territory-percent">{userClan.territoryControlPercent}%</span>
        </div>
      )}

      {onContribute && (
        <button type="button" className="clan-contribute-button" onClick={onContribute} data-testid="clan-contribute-button">
          Contribute Points
        </button>
      )}
    </div>
  );
};
