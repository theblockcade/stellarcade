import React from "react";

import { cn } from "../lib/utils";

/**
 * Ported from frontend/src/components/v1/SegmentedControl.tsx; styling has
 * since moved from SegmentedControl.css to Tailwind utilities. The semantic
 * class names (`segmented-control`, `is-active`, …) are kept as stable test
 * and query hooks — they no longer carry any styling.
 */

export interface SegmentedControlOption<T extends string> {
  value: T;
  label: string;
  disabled?: boolean;
  count?: number;
}

export interface SegmentedControlProps<T extends string> {
  label: string;
  options: Array<SegmentedControlOption<T>>;
  value: T;
  onChange: (value: T) => void;
  className?: string;
  testId?: string;
}

export function SegmentedControl<T extends string>({
  label,
  options,
  value,
  onChange,
  className,
  testId = "segmented-control",
}: SegmentedControlProps<T>): React.JSX.Element {
  return (
    <div
      className={cn(
        "segmented-control inline-flex flex-wrap items-center gap-1.5 rounded-full border border-border bg-foreground/4 p-1",
        className,
      )}
      role="group"
      aria-label={label}
      data-testid={testId}
    >
      {options.map((option) => {
        const isActive = option.value === value;

        return (
          <button
            key={option.value}
            type="button"
            className={cn(
              "segmented-control__button inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm transition-colors",
              "hover:text-foreground focus-visible:text-foreground focus-visible:outline-none",
              "disabled:cursor-not-allowed disabled:opacity-45",
              isActive ? "is-active bg-foreground/12 text-foreground" : "text-muted-foreground",
            )}
            aria-pressed={isActive}
            disabled={option.disabled}
            onClick={() => onChange(option.value)}
            data-testid={`${testId}-${option.value}`}
          >
            <span>{option.label}</span>
            {typeof option.count === "number" ? (
              <span
                className="segmented-control__count min-w-5 rounded-full bg-black/25 px-1.5 py-px text-center text-xs"
                aria-hidden="true"
              >
                {option.count}
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}

export default SegmentedControl;
