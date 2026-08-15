"use client";

import * as React from "react";
import { Area, AreaChart, ResponsiveContainer } from "recharts";
import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";

import { cn } from "@/lib/utils";

export type StatTrend = "up" | "down" | "flat";

export interface StatTileProps extends React.ComponentProps<"div"> {
  label: string;
  value: string;
  /** Signed change, already formatted (e.g. "+12.4%"). */
  delta?: string;
  trend?: StatTrend;
  /** Short qualifier under the value, e.g. "vs. last 7d". */
  caption?: string;
  icon?: React.ReactNode;
  /** Sparkline series. Rendered only when at least two points are supplied. */
  series?: number[];
  /**
   * No data source behind this metric yet. Renders an em-dash in place of the
   * value and suppresses delta/sparkline entirely, so an empty tile can never
   * be mistaken for a real reading of zero.
   */
  empty?: boolean;
}

const TREND_STYLES: Record<StatTrend, { text: string; chart: string; Icon: React.ElementType }> = {
  up: { text: "text-emerald-400", chart: "var(--sc-success)", Icon: ArrowUpRight },
  down: { text: "text-rose-400", chart: "var(--sc-error)", Icon: ArrowDownRight },
  flat: { text: "text-muted-foreground", chart: "var(--sc-text-dim)", Icon: Minus },
};

/**
 * The dashboard's KPI unit: label, big number, signed delta, and an optional
 * sparkline. The sparkline is deliberately unlabelled — it carries shape, not
 * readable values, so it gets no axes, grid, or tooltip. Anything that needs
 * exact numbers belongs in a real chart, not here.
 */
export function StatTile({
  label,
  value,
  delta,
  trend = "flat",
  caption,
  icon,
  series,
  empty = false,
  className,
  ...props
}: StatTileProps) {
  const { text, chart, Icon } = TREND_STYLES[trend];
  const gradientId = React.useId();
  const points = React.useMemo(
    () => (empty ? [] : (series ?? []).map((v, i) => ({ i, v }))),
    [series, empty],
  );

  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-xl border border-border bg-card/60 p-4 backdrop-blur-sm",
        "transition-colors hover:border-primary/40",
        className,
      )}
      {...props}
    >
      <div className="flex items-start justify-between gap-3">
        <p className="text-[11px] font-semibold tracking-[0.14em] text-muted-foreground uppercase">
          {label}
        </p>
        {icon ? (
          <span className="shrink-0 text-primary/70 transition-colors group-hover:text-primary [&_svg]:size-4">
            {icon}
          </span>
        ) : null}
      </div>

      <p
        className={cn(
          "mt-3 font-mono text-2xl font-bold tabular-nums sm:text-3xl",
          empty ? "text-muted-foreground/50" : "text-foreground",
        )}
      >
        {empty ? "—" : value}
      </p>

      <div className="mt-1.5 flex items-center gap-2 text-xs">
        {delta && !empty ? (
          <span className={cn("inline-flex items-center gap-0.5 font-semibold", text)}>
            <Icon className="size-3.5" aria-hidden />
            {delta}
          </span>
        ) : null}
        {caption ? <span className="truncate text-muted-foreground">{caption}</span> : null}
      </div>

      {points.length > 1 ? (
        <div className="pointer-events-none mt-3 h-10" aria-hidden>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={points} margin={{ top: 2, right: 0, bottom: 0, left: 0 }}>
              <defs>
                <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={chart} stopOpacity={0.35} />
                  <stop offset="100%" stopColor={chart} stopOpacity={0} />
                </linearGradient>
              </defs>
              <Area
                type="monotone"
                dataKey="v"
                stroke={chart}
                strokeWidth={1.75}
                fill={`url(#${gradientId})`}
                isAnimationActive={false}
                dot={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      ) : null}
    </div>
  );
}

export default StatTile;
