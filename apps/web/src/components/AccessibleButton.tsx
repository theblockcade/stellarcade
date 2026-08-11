import React from "react";

function hexToRgb(hex: string): [number, number, number] {
  const cleaned = hex.replace(/^#/, "");
  const expanded =
    cleaned.length === 3
      ? cleaned
          .split("")
          .map((c) => c + c)
          .join("")
      : cleaned;

  const r = parseInt(expanded.slice(0, 2), 16);
  const g = parseInt(expanded.slice(2, 4), 16);
  const b = parseInt(expanded.slice(4, 6), 16);

  return [r, g, b];
}

function toLinear(channel: number): number {
  const sRGB = channel / 255;
  return sRGB <= 0.03928 ? sRGB / 12.92 : Math.pow((sRGB + 0.055) / 1.055, 2.4);
}

function relativeLuminance(hex: string): number {
  const [r, g, b] = hexToRgb(hex);
  const R = toLinear(r);
  const G = toLinear(g);
  const B = toLinear(b);
  return 0.2126 * R + 0.7152 * G + 0.0722 * B;
}

export function getContrastRatio(hex1: string, hex2: string): number {
  const l1 = relativeLuminance(hex1);
  const l2 = relativeLuminance(hex2);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

export function meetsWcagAA(hex1: string, hex2: string, large = false): boolean {
  const ratio = getContrastRatio(hex1, hex2);
  return ratio >= (large ? 3 : 4.5);
}

export interface AccessibleButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  label: string;
  variant?: "primary" | "secondary" | "danger" | "ghost";
  loading?: boolean;
  loadingLabel?: string;
  pressed?: boolean;
  expanded?: boolean;
  controls?: string;
}

export const AccessibleButton: React.FC<AccessibleButtonProps> = ({
  label,
  variant,
  loading = false,
  loadingLabel,
  pressed,
  expanded,
  controls,
  disabled,
  children,
  type = "button",
  ...rest
}) => {
  const isDisabled = loading || disabled;

  const resolvedAriaLabel =
    loading && loadingLabel ? loadingLabel : label;

  return (
    <button
      type={type as "button" | "submit" | "reset"}
      role="button"
      aria-label={resolvedAriaLabel}
      aria-busy={loading || undefined}
      aria-disabled={isDisabled || undefined}
      aria-pressed={pressed !== undefined ? pressed : undefined}
      aria-expanded={expanded !== undefined ? expanded : undefined}
      aria-controls={controls}
      data-variant={variant}
      disabled={isDisabled}
      {...rest}
    >
      {children}
    </button>
  );
};

export default AccessibleButton;
