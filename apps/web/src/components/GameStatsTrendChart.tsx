"use client";

import React, { useMemo, useState } from "react";
import "./GameStatsTrendChart.css";

export type TrendDirection = "up" | "down" | "flat";

export interface TrendDataPoint {
  label: string;
  value: number;
  change?: number;
}

export interface GameStatsTrendChartProps {
  dataPoints: TrendDataPoint[];
  metricLabel: string;
  isLoading?: boolean;
  emptyLabel?: string;
  formatValue?: (value: number) => string;
  className?: string;
  testId?: string;
}

function getTrendDirection(dataPoints: TrendDataPoint[]): TrendDirection {
  if (dataPoints.length < 2) return "flat";
  const first = dataPoints[0].value;
  const last = dataPoints[dataPoints.length - 1].value;
  if (last > first) return "up";
  if (last < first) return "down";
  return "flat";
}

function getMaxValue(dataPoints: TrendDataPoint[]): number {
  if (dataPoints.length === 0) return 0;
  return Math.max(...dataPoints.map((p) => p.value));
}

function getMinValue(dataPoints: TrendDataPoint[]): number {
  if (dataPoints.length === 0) return 0;
  return Math.min(...dataPoints.map((p) => p.value));
}

function calculateBarHeight(value: number, min: number, max: number): number {
  if (max === min) return 50;
  return ((value - min) / (max - min)) * 80 + 10;
}

export const GameStatsTrendChart: React.FC<GameStatsTrendChartProps> = ({
  dataPoints,
  metricLabel,
  isLoading = false,
  emptyLabel = "No data available",
  formatValue = (v) => v.toLocaleString(),
  className = "",
  testId = "game-stats-trend-chart",
}) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const trend = useMemo(() => getTrendDirection(dataPoints), [dataPoints]);
  const maxValue = useMemo(() => getMaxValue(dataPoints), [dataPoints]);
  const minValue = useMemo(() => getMinValue(dataPoints), [dataPoints]);

  const isEmpty = dataPoints.length === 0;
  const trendLabel = trend === "up" ? "Increasing" : trend === "down" ? "Decreasing" : "Stable";
  const trendIcon = trend === "up" ? "▲" : trend === "down" ? "▼" : "—";

  if (isLoading) {
    return (
      <div
        className={`game-stats-trend-chart game-stats-trend-chart--loading ${className}`}
        data-testid={`${testId}-loading`}
        role="status"
        aria-label={`Loading ${metricLabel} trend data`}
        aria-live="polite"
      >
        <div className="game-stats-trend-chart__skeleton" aria-hidden="true" />
        <span className="game-stats-trend-chart__sr-only">Loading…</span>
      </div>
    );
  }

  if (isEmpty) {
    return (
      <div
        className={`game-stats-trend-chart game-stats-trend-chart--empty ${className}`}
        data-testid={`${testId}-empty`}
        role="status"
        aria-label={`${metricLabel}: ${emptyLabel}`}
      >
        {emptyLabel}
      </div>
    );
  }

  return (
    <div
      className={`game-stats-trend-chart ${className}`}
      data-testid={testId}
      role="figure"
      aria-label={`${metricLabel} trend chart, overall ${trendLabel}`}
    >
      <div className="game-stats-trend-chart__header">
        <h3 className="game-stats-trend-chart__title">{metricLabel}</h3>
        <span
          className={`game-stats-trend-chart__trend game-stats-trend-chart__trend--${trend}`}
          aria-label={`Trend: ${trendLabel}`}
        >
          <span aria-hidden="true">{trendIcon}</span>
          <span>{trendLabel}</span>
        </span>
      </div>

      <div
        className="game-stats-trend-chart__bars"
        role="img"
        aria-label={`${metricLabel} values over time`}
      >
        {dataPoints.map((point, index) => {
          const height = calculateBarHeight(point.value, minValue, maxValue);
          const isHovered = hoveredIndex === index;

          return (
            <div
              key={`${point.label}-${index}`}
              className="game-stats-trend-chart__bar-group"
              onMouseEnter={() => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(null)}
              onFocus={() => setHoveredIndex(index)}
              onBlur={() => setHoveredIndex(null)}
              tabIndex={0}
              role="listitem"
              aria-label={`${point.label}: ${formatValue(point.value)}`}
            >
              <div className="game-stats-trend-chart__bar-wrapper">
                <div
                  className={`game-stats-trend-chart__bar ${
                    isHovered ? "game-stats-trend-chart__bar--hovered" : ""
                  }`}
                  style={{ height: `${height}%` }}
                  aria-hidden="true"
                />
              </div>
              <span className="game-stats-trend-chart__label">{point.label}</span>
              {isHovered && (
                <div className="game-stats-trend-chart__tooltip" role="tooltip">
                  {formatValue(point.value)}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="game-stats-trend-chart__summary">
        <span className="game-stats-trend-chart__range">
          Range: {formatValue(minValue)} – {formatValue(maxValue)}
        </span>
      </div>
    </div>
  );
};

GameStatsTrendChart.displayName = "GameStatsTrendChart";
export default GameStatsTrendChart;
