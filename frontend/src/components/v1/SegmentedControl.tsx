import React from "react";
import "./SegmentedControl.css";

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
      className={["segmented-control", className].filter(Boolean).join(" ")}
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
            className={[
              "segmented-control__button",
              isActive ? "is-active" : "",
            ]
              .filter(Boolean)
              .join(" ")}
            aria-pressed={isActive}
            disabled={option.disabled}
            onClick={() => onChange(option.value)}
            data-testid={`${testId}-${option.value}`}
          >
            <span>{option.label}</span>
            {typeof option.count === "number" ? (
              <span className="segmented-control__count" aria-hidden="true">
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
