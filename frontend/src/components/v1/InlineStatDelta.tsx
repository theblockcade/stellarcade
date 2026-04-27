import React from "react";
import "./InlineStatDelta.css";

export interface InlineStatDeltaProps {
  value: number | null;
  label?: string;
  loading?: boolean;
  className?: string;
  testId?: string;
}

function getDeltaTone(value: number | null): "up" | "down" | "flat" | "empty" {
  if (value === null) {
    return "empty";
  }
  if (value > 0) {
    return "up";
  }
  if (value < 0) {
    return "down";
  }
  return "flat";
}

function formatDelta(value: number): string {
  if (value > 0) {
    return `+${value}`;
  }
  return String(value);
}

export const InlineStatDelta: React.FC<InlineStatDeltaProps> = ({
  value,
  label = "vs last refresh",
  loading = false,
  className = "",
  testId = "inline-stat-delta",
}) => {
  if (loading) {
    return (
      <span
        className={`inline-stat-delta inline-stat-delta--loading ${className}`.trim()}
        aria-live="polite"
        data-testid={testId}
      >
        Updating
      </span>
    );
  }

  const tone = getDeltaTone(value);
  const content = value === null ? "--" : formatDelta(value);

  return (
    <span
      className={`inline-stat-delta inline-stat-delta--${tone} ${className}`.trim()}
      aria-live="polite"
      data-testid={testId}
    >
      <span className="inline-stat-delta__value">{content}</span>
      <span className="inline-stat-delta__label">{label}</span>
    </span>
  );
};

export default InlineStatDelta;
