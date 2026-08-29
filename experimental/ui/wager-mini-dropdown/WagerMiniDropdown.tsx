'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import type { WagerMiniDropdownProps, WagerSummary } from './types';

const shellStyle: React.CSSProperties = { position: 'relative', display: 'inline-block' };
const triggerStyle: React.CSSProperties = {
  alignItems: 'center',
  background: 'linear-gradient(135deg, #101827 0%, #152137 100%)',
  border: '1px solid rgba(56, 189, 248, 0.34)',
  borderRadius: 8,
  color: '#e2e8f0',
  cursor: 'pointer',
  display: 'inline-flex',
  fontSize: 14,
  fontWeight: 800,
  gap: 8,
  minHeight: 40,
  padding: '9px 12px',
};
const unreadDotStyle: React.CSSProperties = {
  background: '#22c55e',
  borderRadius: 999,
  boxShadow: '0 0 14px rgba(34, 197, 94, 0.8)',
  height: 8,
  width: 8,
};
const panelStyle: React.CSSProperties = {
  background: '#0b1220',
  border: '1px solid rgba(148, 163, 184, 0.22)',
  borderRadius: 8,
  boxShadow: '0 20px 52px rgba(0, 0, 0, 0.36)',
  color: '#f8fafc',
  marginTop: 8,
  minWidth: 360,
  padding: 14,
  position: 'absolute',
  right: 0,
  zIndex: 20,
};
const rowStyle: React.CSSProperties = {
  alignItems: 'center',
  background: 'rgba(15, 23, 42, 0.72)',
  border: '1px solid rgba(51, 65, 85, 0.9)',
  borderRadius: 8,
  cursor: 'pointer',
  display: 'grid',
  gap: 10,
  gridTemplateColumns: '32px 1fr auto',
  marginTop: 8,
  padding: 10,
  textAlign: 'left',
  width: '100%',
};
const pillBase: React.CSSProperties = {
  borderRadius: 999,
  fontSize: 11,
  fontWeight: 800,
  padding: '3px 8px',
  textTransform: 'uppercase',
};

export function formatMiniWagerDelta(value: number): string {
  const sign = value > 0 ? '+' : value < 0 ? '-' : '';
  return `${sign}${Math.abs(value).toFixed(2)} XLM`;
}

export function getOutcomeTone(outcome: WagerSummary['outcome']) {
  if (outcome === 'won') return { background: 'rgba(34, 197, 94, 0.14)', color: '#bbf7d0' };
  if (outcome === 'lost') return { background: 'rgba(248, 113, 113, 0.14)', color: '#fecaca' };
  return { background: 'rgba(56, 189, 248, 0.14)', color: '#bae6fd' };
}

export function getRecentWagers(wagers: WagerSummary[]): WagerSummary[] {
  return [...wagers]
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 5);
}

export const WagerMiniDropdown: React.FC<WagerMiniDropdownProps> = ({
  recentWagers,
  onViewFullHistory,
  onSelectWager,
  explorerBaseUrl = 'https://stellar.expert/explorer/testnet/tx',
  className = '',
  testId = 'wager-mini-dropdown',
}) => {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const visibleWagers = useMemo(() => getRecentWagers(recentWagers), [recentWagers]);
  const hasUnreadWin = visibleWagers.some((wager) => wager.outcome === 'won');

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={rootRef} className={className} style={shellStyle} data-testid={testId}>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-haspopup="menu"
        style={triggerStyle}
        data-testid={`${testId}-trigger`}
      >
        <span aria-hidden="true">???</span>
        Recent Wagers
        {hasUnreadWin ? <span style={unreadDotStyle} aria-label="Unread win" /> : null}
      </button>

      {open ? (
        <div role="menu" style={panelStyle} data-testid={`${testId}-panel`}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center' }}>
            <strong style={{ fontSize: 14 }}>Last 5 Results</strong>
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                onViewFullHistory();
              }}
              style={{ background: 'transparent', border: 0, color: '#38bdf8', cursor: 'pointer', fontSize: 12, fontWeight: 800 }}
            >
              View Full History
            </button>
          </div>

          {visibleWagers.length === 0 ? (
            <div style={{ color: '#94a3b8', fontSize: 13, padding: '28px 8px', textAlign: 'center' }}>
              No recent wagers yet.
            </div>
          ) : (
            visibleWagers.map((wager) => {
              const tone = getOutcomeTone(wager.outcome);
              const deltaColor = wager.netProfitXlm >= 0 ? '#86efac' : '#fca5a5';
              return (
                <button
                  type="button"
                  role="menuitem"
                  key={wager.id}
                  style={rowStyle}
                  onClick={() => onSelectWager?.(wager.txHash)}
                  data-testid={`${testId}-item-${wager.id}`}
                >
                  <span style={{ fontSize: 22 }} aria-hidden="true">{wager.gameIcon}</span>
                  <span style={{ minWidth: 0 }}>
                    <span style={{ display: 'block', fontSize: 13, fontWeight: 800 }}>{wager.gameName}</span>
                    <span style={{ color: '#94a3b8', display: 'block', fontSize: 12 }}>
                      {new Date(wager.timestamp).toLocaleString()} ?? {wager.wagerAmountXlm.toFixed(2)} XLM
                    </span>
                    <a
                      href={`${explorerBaseUrl}/${wager.txHash}`}
                      onClick={(event) => event.stopPropagation()}
                      style={{ color: '#67e8f9', display: 'block', fontSize: 11, marginTop: 2 }}
                    >
                      {wager.txHash.slice(0, 10)}...
                    </a>
                  </span>
                  <span style={{ textAlign: 'right' }}>
                    <span style={{ ...pillBase, ...tone }}>{wager.outcome}</span>
                    <span style={{ color: deltaColor, display: 'block', fontSize: 13, fontWeight: 900, marginTop: 6 }}>
                      {formatMiniWagerDelta(wager.netProfitXlm)}
                    </span>
                  </span>
                </button>
              );
            })
          )}
        </div>
      ) : null}
    </div>
  );
};

WagerMiniDropdown.displayName = 'WagerMiniDropdown';
export default WagerMiniDropdown;