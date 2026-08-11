"use client";

import React from "react";
import "./WalletContractHealthChips.css";

export type WalletSurfaceStatus =
  | "connected"
  | "connecting"
  | "disconnected"
  | "error";

export type ContractSurfaceStatus =
  | "active"
  | "paused"
  | "degraded"
  | "error";

export interface HealthChipSurface {
  id: string;
  label: string;
  status: WalletSurfaceStatus | ContractSurfaceStatus | string;
  detail?: string;
}

export interface WalletContractHealthChipsProps {
  surfaces: HealthChipSurface[];
  isLoading?: boolean;
  className?: string;
  testId?: string;
  ariaLabel?: string;
}

type ChipTone = "success" | "pending" | "warning" | "error" | "neutral";

function resolveTone(status: string): ChipTone {
  switch (status) {
    case "connected":
    case "active":
      return "success";
    case "connecting":
      return "pending";
    case "paused":
    case "degraded":
      return "warning";
    case "error":
      return "error";
    default:
      return "neutral";
  }
}

const STATUS_ICONS: Record<string, string> = {
  connected: "●",
  connecting: "◌",
  disconnected: "○",
  active: "●",
  paused: "⏸",
  degraded: "⚠",
  error: "✕",
};

export const WalletContractHealthChips: React.FC<WalletContractHealthChipsProps> = ({
  surfaces,
  isLoading = false,
  className = "",
  testId = "wallet-contract-health-chips",
  ariaLabel = "Surface health overview",
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
          const icon = STATUS_ICONS[surface.status] ?? "●";

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

WalletContractHealthChips.displayName = "WalletContractHealthChips";

export default WalletContractHealthChips;
