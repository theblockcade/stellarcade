import React from 'react';

// ---------------------------------------------------------------------------
// WCAG contrast utilities
// ---------------------------------------------------------------------------

function hexToRgb(hex: string): [number, number, number] {
  const cleaned = hex.replace(/^#/, '');
  const expanded =
    cleaned.length === 3
      ? cleaned
          .split('')
          .map((c) => c + c)
          .join('')
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

/**
 * Computes the WCAG 2.x contrast ratio between two hex colors.
 * Returns a value between 1 and 21.
 */
export function getContrastRatio(hex1: string, hex2: string): number {
  const l1 = relativeLuminance(hex1);
  const l2 = relativeLuminance(hex2);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Returns true if the contrast ratio between two hex colors meets the WCAG AA
 * threshold (4.5:1 for normal text, 3:1 for large text).
 */
export function meetsWcagAA(hex1: string, hex2: string, large = false): boolean {
  const ratio = getContrastRatio(hex1, hex2);
  return ratio >= (large ? 3 : 4.5);
}

// ---------------------------------------------------------------------------
// AccessibleButton component
// ---------------------------------------------------------------------------

export interface AccessibleButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Required accessible label. Maps to aria-label when children is absent. */
  label: string;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  loading?: boolean;
  /** aria-label override while the button is in a loading state. */
  loadingLabel?: string;
  /** Maps to aria-pressed. */
  pressed?: boolean;
  /** Maps to aria-expanded. */
  expanded?: boolean;
  /** Maps to aria-controls. */
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
  type = 'button',
  ...rest
}) => {
  const isDisabled = loading || disabled;

  // Use aria-label only when there is no visible text content from children.
  const hasTextChildren =
    children !== undefined && children !== null && children !== false;
  const resolvedAriaLabel = loading && loadingLabel
    ? loadingLabel
    : !hasTextChildren
    ? label
    : label;

  return (
    <button
      type={type as 'button' | 'submit' | 'reset'}
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
