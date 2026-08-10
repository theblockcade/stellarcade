import * as React from "react";
import { Card } from "./ui/card";
import { Skeleton } from "./ui/skeleton";
import { Button } from "./ui/button";
import { cn } from "../lib/utils";

export type MetricCardStatus = "idle" | "loading" | "success" | "error";
export type MetricTrend = "up" | "down" | "neutral";

export interface MetricCardProps {
  label: string;
  value?: React.ReactNode;
  status?: MetricCardStatus;
  change?: string;
  trend?: MetricTrend;
  caption?: string;
  error?: string;
  onRetry?: () => void;
  className?: string;
  testId?: string;
  ariaLabel?: string;
}

const TREND_ICONS: Record<MetricTrend, string> = {
  up: "▲",
  down: "▼",
  neutral: "—",
};

const TREND_STYLES: Record<MetricTrend, string> = {
  up: "text-[color:var(--sc-success)] bg-[color:var(--sc-success)]/10",
  down: "text-destructive bg-destructive/10",
  neutral: "text-muted-foreground bg-muted",
};

function TrendChip({ trend, change }: { trend: MetricTrend; change: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold",
        TREND_STYLES[trend],
      )}
      aria-label={`Trend: ${trend}, change ${change}`}
    >
      <span aria-hidden="true">{TREND_ICONS[trend]}</span>
      <span>{change}</span>
    </span>
  );
}

/** Next.js/shadcn port of frontend/src/components/v1/MetricCard.tsx — same
 * loading/error/empty/success state machine, rebuilt on shadcn's Card +
 * Skeleton + Button (pulled via 21st.dev) instead of hand-rolled CSS. */
export const MetricCard: React.FC<MetricCardProps> = ({
  label,
  value,
  status = "success",
  change,
  trend = "neutral",
  caption,
  error,
  onRetry,
  className = "",
  testId = "metric-card",
  ariaLabel,
}) => {
  const isLoading = status === "loading";
  const isError = status === "error";
  const isEmpty = status === "success" && (value === undefined || value === null || value === "");

  return (
    <Card
      className={cn("gap-2 px-6 py-5", className)}
      data-testid={testId}
      aria-label={ariaLabel ?? label}
      aria-busy={isLoading}
    >
      <h3
        className="m-0 text-xs font-semibold tracking-wider text-muted-foreground uppercase"
        data-testid={`${testId}-label`}
      >
        {label}
      </h3>

      {isLoading && (
        <div className="flex flex-col gap-2 pt-1" data-testid={`${testId}-loading`} aria-hidden="true">
          <Skeleton className="h-8 w-[55%]" />
          <Skeleton className="h-3 w-[70%]" />
        </div>
      )}

      {isError && (
        <div
          className="flex items-center gap-3 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2"
          data-testid={`${testId}-error`}
          role="alert"
          aria-live="assertive"
        >
          <span className="flex-1 text-sm text-destructive">{error ?? "Failed to load metric."}</span>
          {onRetry && (
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="text-destructive hover:text-destructive"
              onClick={onRetry}
              data-testid={`${testId}-retry`}
              aria-label={`Retry loading ${label}`}
            >
              Retry
            </Button>
          )}
        </div>
      )}

      {isEmpty && (
        <div className="flex items-center pt-0.5" data-testid={`${testId}-empty`}>
          <span className="text-2xl font-bold text-muted-foreground/40" aria-label="No data">
            —
          </span>
        </div>
      )}

      {!isLoading && !isError && !isEmpty && (
        <div className="flex flex-wrap items-baseline gap-2" data-testid={`${testId}-body`}>
          <span className="text-3xl font-bold tracking-tight" data-testid={`${testId}-value`}>
            {value}
          </span>
          {change !== undefined && <TrendChip trend={trend} change={change} />}
        </div>
      )}

      {caption && !isLoading && !isError && (
        <p className="m-0 text-xs text-muted-foreground" data-testid={`${testId}-caption`}>
          {caption}
        </p>
      )}
    </Card>
  );
};

export default MetricCard;
