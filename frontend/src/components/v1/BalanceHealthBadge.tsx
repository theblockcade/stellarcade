import React from "react";
import { StatusPill, type StatusPillTone } from "./StatusPill";
import "./BalanceHealthBadge.css";

export type BalanceHealth = "healthy" | "low" | "empty" | "unknown" | "loading";

export interface BalanceHealthBadgeProps {
  balance?: number | null;
  loading?: boolean;
  lowBalanceThreshold?: number;
  testId?: string;
}

export interface BalanceHealthMeta {
  health: BalanceHealth;
  label: string;
  tone: StatusPillTone;
  ariaLabel: string;
}

export function getBalanceHealthMeta({
  balance,
  loading = false,
  lowBalanceThreshold = 10,
}: BalanceHealthBadgeProps): BalanceHealthMeta {
  if (loading) {
    return {
      health: "loading",
      label: "Checking",
      tone: "pending",
      ariaLabel: "Balance health: checking",
    };
  }

  if (balance === null || balance === undefined || Number.isNaN(balance)) {
    return {
      health: "unknown",
      label: "Unknown",
      tone: "neutral",
      ariaLabel: "Balance health: unknown",
    };
  }

  if (balance <= 0) {
    return {
      health: "empty",
      label: "Empty",
      tone: "error",
      ariaLabel: "Balance health: empty",
    };
  }

  if (balance < lowBalanceThreshold) {
    return {
      health: "low",
      label: "Low",
      tone: "warning",
      ariaLabel: "Balance health: low",
    };
  }

  return {
    health: "healthy",
    label: "Healthy",
    tone: "success",
    ariaLabel: "Balance health: healthy",
  };
}

export const BalanceHealthBadge: React.FC<BalanceHealthBadgeProps> = ({
  balance,
  loading = false,
  lowBalanceThreshold = 10,
  testId = "balance-health-badge",
}) => {
  const meta = getBalanceHealthMeta({ balance, loading, lowBalanceThreshold });

  return (
    <StatusPill
      tone={meta.tone}
      label={meta.label}
      size="compact"
      className={`balance-health-badge balance-health-badge--${meta.health}`}
      testId={testId}
      ariaLabel={meta.ariaLabel}
    />
  );
};

BalanceHealthBadge.displayName = "BalanceHealthBadge";

export default BalanceHealthBadge;
