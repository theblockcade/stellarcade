/**
 * WalletContractHealthChips — v1
 *
 * Compact status-chip strip for wallet and contract surfaces.
 * Renders one chip per surface; each chip reflects the current
 * health/connection state with an accessible role="status" span.
 */

import React, { useMemo } from 'react';
import './WalletContractHealthChips.css';

// ── Types ──────────────────────────────────────────────────────────────────

export type WalletSurfaceStatus =
  | 'connected'
  | 'connecting'
  | 'disconnected'
  | 'error';

export type ContractSurfaceStatus =
  | 'active'
  | 'paused'
  | 'degraded'
  | 'error';

export interface HealthChipSurface {
  /** Unique key for the surface. */
  id: string;
  /** Display label (e.g. "Wallet", "PrizePool"). */
  label: string;
  /** Current status for this surface. */
  status: WalletSurfaceStatus | ContractSurfaceStatus | string;
  /** Optional detail text (e.g. truncated address, contract address). */
  detail?: string;
}

export interface WalletContractHealthChipsProps {
  surfaces: HealthChipSurface[];
  /** Loading state — shows skeleton chips. */
  isLoading?: boolean;
  /** Number of skeleton chips to show while loading. */
  skeletonCount?: number;
  className?: string;
  testId?: string;
  ariaLabel?: string;
}

// ── Status → tone mapping ──────────────────────────────────────────────────

type ChipTone = 'success' | 'pending' | 'warning' | 'error' | 'neutral';

function resolveTone(status: string): ChipTone {
  switch (status) {
    case 'connected':
    case 'active':
      return 'success';
    case 'connecting':
      return 'pending';
    case 'paused':
    case 'degraded':
      return 'warning';
    case 'error':
      return 'error';
    default:
      return 'neutral';
  }
}

const STATUS_ICONS: Record<string, string> = {
  connected: '●',
  connecting: '◌',
  disconnected: '○',
  active: '●',
  paused: '⏸',
  degraded: '⚠',
  error: '✕',
};

// ── Component ──────────────────────────────────────────────────────────────

export const WalletContractHealthChips: React.FC<WalletContractHealthChipsProps> = ({
  surfaces,
  isLoading = false,
  skeletonCount = 2,
  className = '',
  testId = 'wallet-contract-health-chips',
  ariaLabel = 'Surface health overview',
}) => {
  const isEmpty = !isLoading && surfaces.length === 0;

  return (
    <div
      className={`wchc ${className}`}
      data-testid={testId}
      role="region"
      aria-label={ariaLabel}
      aria-busy={isLoading}
    >
      {isLoading &&
        Array.from({ length: skeletonCount }).map((_, i) => (
          <span
            key={i}
            className="wchc__chip wchc__chip--skeleton"
            data-testid={`${testId}-skeleton`}
            aria-hidden="true"
          />
        ))}

      {isEmpty && (
        <span
          className="wchc__empty"
          data-testid={`${testId}-empty`}
          aria-live="polite"
        >
          No surfaces to display
        </span>
      )}

      {!isLoading &&
        surfaces.map((surface) => {
          const tone = resolveTone(surface.status);
          const icon = STATUS_ICONS[surface.status] ?? '●';

          return (
            <span
              key={surface.id}
              className={`wchc__chip wchc__chip--${tone}`}
              data-testid={`${testId}-chip-${surface.id}`}
              data-tone={tone}
              role="status"
              aria-label={`${surface.label}: ${surface.status}`}
              title={surface.detail}
            >
              <span className="wchc__chip-icon" aria-hidden="true">
                {icon}
              </span>
              <span className="wchc__chip-label">{surface.label}</span>
              <span className="wchc__chip-status">{surface.status}</span>
            </span>
          );
        })}
    </div>
  );
};

WalletContractHealthChips.displayName = 'WalletContractHealthChips';

export default WalletContractHealthChips;
