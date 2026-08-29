'use client';

import React, { useEffect, useMemo, useRef } from 'react';
import type { LeaderboardPrizeTickerProps, PrizeDistribution } from './types';

const ONE_SECOND_MS = 1000;
const URGENT_THRESHOLD_MS = 30 * 60 * ONE_SECOND_MS;

const shellStyle: React.CSSProperties = {
  alignItems: 'center',
  background: 'linear-gradient(135deg, #101827 0%, #162132 46%, #241338 100%)',
  border: '1px solid rgba(244, 211, 94, 0.34)',
  borderRadius: 8,
  boxShadow: '0 16px 40px rgba(0, 0, 0, 0.24)',
  color: '#f8fafc',
  display: 'grid',
  gap: 16,
  gridTemplateColumns: 'minmax(180px, 1fr) auto minmax(220px, 1.2fr) auto',
  padding: '16px 18px',
};

const labelStyle: React.CSSProperties = {
  color: '#a7b5c8',
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: 0,
  textTransform: 'uppercase',
};

const poolStyle: React.CSSProperties = {
  color: '#f4d35e',
  fontSize: 24,
  fontWeight: 800,
  lineHeight: 1.1,
  textShadow: '0 0 16px rgba(244, 211, 94, 0.48)',
};

const clockStyle: React.CSSProperties = {
  background: 'rgba(15, 23, 42, 0.72)',
  border: '1px solid rgba(148, 163, 184, 0.24)',
  borderRadius: 6,
  color: '#e2e8f0',
  fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
  fontSize: 24,
  fontVariantNumeric: 'tabular-nums',
  fontWeight: 800,
  minWidth: 132,
  padding: '10px 12px',
  textAlign: 'center',
};

const chipsStyle: React.CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: 8,
};

const chipStyle: React.CSSProperties = {
  background: 'rgba(34, 197, 94, 0.13)',
  border: '1px solid rgba(34, 197, 94, 0.3)',
  borderRadius: 6,
  color: '#dcfce7',
  fontSize: 13,
  fontWeight: 700,
  padding: '8px 10px',
};

const rankStyle: React.CSSProperties = {
  background: 'rgba(56, 189, 248, 0.13)',
  border: '1px solid rgba(56, 189, 248, 0.32)',
  borderRadius: 999,
  color: '#bae6fd',
  fontSize: 13,
  fontWeight: 800,
  padding: '8px 12px',
  whiteSpace: 'nowrap',
};

const tickerStyles = `
.leaderboard-prize-ticker__clock.is-urgent {
  border-color: rgba(248, 113, 113, 0.7);
  color: #fecaca;
  animation: leaderboard-prize-ticker-pulse 1s ease-in-out infinite;
}

@keyframes leaderboard-prize-ticker-pulse {
  0%, 100% { box-shadow: 0 0 0 rgba(248, 113, 113, 0); }
  50% { box-shadow: 0 0 18px rgba(248, 113, 113, 0.42); }
}

@media (max-width: 760px) {
  .leaderboard-prize-ticker {
    grid-template-columns: 1fr;
  }
}
`;

export function formatXlm(value: number): string {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatCountdown(targetResetTs: string, nowMs = Date.now()): string {
  const targetMs = new Date(targetResetTs).getTime();
  const remainingMs = Math.max(0, targetMs - nowMs);
  const totalSeconds = Math.floor(remainingMs / ONE_SECOND_MS);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return [hours, minutes, seconds].map((value) => String(value).padStart(2, '0')).join(':');
}

export function isCountdownUrgent(targetResetTs: string, nowMs = Date.now()): boolean {
  const targetMs = new Date(targetResetTs).getTime();
  const remainingMs = Math.max(0, targetMs - nowMs);
  return remainingMs > 0 && remainingMs <= URGENT_THRESHOLD_MS;
}

export function calculatePrizeDistribution(prizePoolXlm: number, topPrizes: number[]): PrizeDistribution[] {
  return topPrizes.slice(0, 3).map((percentage, index) => ({
    place: (index + 1) as 1 | 2 | 3,
    percentage,
    amountXlm: (prizePoolXlm * percentage) / 100,
  }));
}

function placeLabel(place: PrizeDistribution['place']): string {
  return place === 1 ? '1st' : place === 2 ? '2nd' : '3rd';
}

export const LeaderboardPrizeTicker: React.FC<LeaderboardPrizeTickerProps> = ({
  prizePoolXlm,
  targetResetTs,
  userRank,
  topPrizes,
  className = '',
  testId = 'leaderboard-prize-ticker',
}) => {
  const clockRef = useRef<HTMLSpanElement>(null);
  const distributions = useMemo(
    () => calculatePrizeDistribution(prizePoolXlm, topPrizes),
    [prizePoolXlm, topPrizes],
  );

  useEffect(() => {
    const updateClock = () => {
      if (!clockRef.current) return;
      clockRef.current.textContent = formatCountdown(targetResetTs);
      clockRef.current.classList.toggle('is-urgent', isCountdownUrgent(targetResetTs));
    };

    updateClock();
    const intervalId = window.setInterval(updateClock, ONE_SECOND_MS);
    return () => window.clearInterval(intervalId);
  }, [targetResetTs]);

  return (
    <section
      className={`leaderboard-prize-ticker ${className}`.trim()}
      data-testid={testId}
      style={shellStyle}
      aria-label="Daily leaderboard prize countdown"
    >
      <style>{tickerStyles}</style>

      <div>
        <div style={labelStyle}>Daily Prize Pool</div>
        <div style={poolStyle}>{formatXlm(prizePoolXlm)} XLM Pool</div>
      </div>

      <div>
        <div style={labelStyle}>Resets In</div>
        <span
          ref={clockRef}
          className="leaderboard-prize-ticker__clock"
          data-testid="leaderboard-prize-ticker-clock"
          style={clockStyle}
          aria-live="polite"
        >
          {formatCountdown(targetResetTs)}
        </span>
      </div>

      <div>
        <div style={labelStyle}>Top Prizes</div>
        <div style={chipsStyle}>
          {distributions.map((prize) => (
            <span key={prize.place} style={chipStyle}>
              {placeLabel(prize.place)}: {prize.percentage}% ({formatXlm(prize.amountXlm)} XLM)
            </span>
          ))}
        </div>
      </div>

      {userRank !== undefined ? (
        <span style={rankStyle} data-testid="leaderboard-prize-ticker-rank">
          Your Rank: #{userRank}
        </span>
      ) : null}
    </section>
  );
};

LeaderboardPrizeTicker.displayName = 'LeaderboardPrizeTicker';
export default LeaderboardPrizeTicker;