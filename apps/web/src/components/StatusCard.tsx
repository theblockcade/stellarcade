"use client";

import React, { ReactNode } from "react";
import type { StatusToneVariant } from "../types/status-tone";

interface StatusCardProps {
  id: string;
  name: string;
  status: string;
  wager?: number;
  tone?: StatusToneVariant;
  beforeSlot?: ReactNode;
  afterSlot?: ReactNode;
  bodySlot?: ReactNode;
  footerSlot?: ReactNode;
  hideDefaultAction?: boolean;
  actionLabel?: string;
  isStale?: boolean;
  onAction?: () => void;
}

export const StatusCard: React.FC<StatusCardProps> = ({
  id,
  name,
  status,
  wager,
  tone = "neutral",
  beforeSlot,
  afterSlot,
  bodySlot,
  footerSlot,
  hideDefaultAction = false,
  actionLabel = "Join Game",
  isStale = false,
  onAction,
}: StatusCardProps) => {
  const getToneBorder = () => {
    switch (tone) {
      case "success":
        return "rgba(0, 255, 204, 0.4)";
      case "warning":
        return "rgba(234, 179, 8, 0.4)";
      case "error":
        return "rgba(239, 68, 68, 0.4)";
      case "neutral":
      default:
        return "var(--sc-border-glass, rgba(255, 255, 255, 0.1))";
    }
  };

  return (
    <div
      style={{
        background: "var(--sc-bg-card, rgba(255, 255, 255, 0.04))",
        borderRadius: "14px",
        border: `1px solid ${getToneBorder()}`,
        padding: "1.25rem",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        gap: "1rem",
        opacity: isStale ? 0.75 : 1,
      }}
      data-testid="status-card"
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          {beforeSlot}
          <h3 style={{ fontSize: "1.05rem", fontWeight: 700, margin: 0, color: "#fff" }}>{name}</h3>
        </div>
        <span
          style={{
            fontSize: "11px",
            fontFamily: "var(--sc-font-mono, monospace)",
            color: "var(--sc-text-dim, #94a3b8)",
            background: "rgba(255,255,255,0.06)",
            padding: "2px 6px",
            borderRadius: "4px",
          }}
        >
          #{id.replace(/^#-?/, "").slice(0, 8)}
        </span>
      </div>

      <div>
        {bodySlot ?? (
          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--sc-accent, #00ffcc)" }}>
              {status.toUpperCase()}
              {isStale && (
                <span
                  style={{
                    marginLeft: "8px",
                    padding: "2px 6px",
                    fontSize: "10px",
                    borderRadius: "4px",
                    background: "rgba(234, 179, 8, 0.2)",
                    color: "#facc15",
                    textTransform: "uppercase",
                  }}
                >
                  Stale
                </span>
              )}
            </div>
            {wager !== undefined && (
              <div style={{ fontSize: "1.1rem", fontWeight: 800, color: "#fff" }}>{wager} XLM</div>
            )}
          </div>
        )}
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        {!hideDefaultAction && (
          <button
            type="button"
            onClick={onAction}
            style={{
              padding: "6px 14px",
              borderRadius: "6px",
              background: "var(--sc-accent, #00ffcc)",
              color: "#000",
              fontWeight: 700,
              fontSize: "12px",
              border: "none",
              cursor: "pointer",
            }}
            data-testid={`btn-play-${id}`}
          >
            {actionLabel}
          </button>
        )}
        {footerSlot ?? afterSlot}
      </div>
    </div>
  );
};

export default StatusCard;
