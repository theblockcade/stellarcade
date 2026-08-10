/**
 * Skeleton Design Tokens
 *
 * Centralized design tokens for the skeleton loading system.
 * Token naming is stable — consumers should reference these constants
 * rather than hard-coding values.
 *
 * @module skeleton.tokens
 */

// ── Color tokens ──────────────────────────────────────────────────────
export const skBaseColor = '#e2e8f0';
export const skBaseColorDark = '#334155';
export const skBorderColor = '#e2e8f0';
export const skBorderColorDark = '#334155';

// ── Border-radius tokens ─────────────────────────────────────────────
export const skRadiusSm = '0.25rem';
export const skRadiusMd = '0.5rem';
export const skRadiusLg = '0.75rem';
export const skRadiusCircle = '50%';

// ── Spacing tokens ───────────────────────────────────────────────────
export const skGapSm = '0.5rem';
export const skGapMd = '1rem';
export const skGapLg = '1.5rem';
export const skPadding = '1.5rem';

// ── Animation tokens ─────────────────────────────────────────────────
export const skPulseDuration = '1.5s';
export const skPulseEasing = 'cubic-bezier(0.4, 0, 0.6, 1)';

// ── Dimension tokens ─────────────────────────────────────────────────
export const skHeightTextSm = '12px';
export const skHeightTextMd = '16px';
export const skHeightTextLg = '24px';
export const skHeightHeading = '28px';
export const skHeightThumbnail = '150px';
export const skHeightDetailBanner = '200px';
export const skSizeAvatarSm = '32px';
export const skSizeAvatarMd = '40px';
export const skSizeAvatarLg = '64px';

// ── Preset shape definition ──────────────────────────────────────────

/** Describes a single skeleton shape within a preset. */
export interface SkeletonShape {
  width?: string;
  height: string;
  borderRadius?: string;
  circle?: boolean;
}

/** Available preset type names. */
export type SkeletonPresetType = 'card' | 'list' | 'detail';

/**
 * Named loading presets.
 *
 * Each preset defines an array of skeleton shapes that compose a
 * recognisable loading placeholder for a common UI pattern.
 */
export const SKELETON_PRESETS: Record<SkeletonPresetType, SkeletonShape[]> = {
  /**
   * Card preset — mimics a content card with a large thumbnail,
   * a heading bar, and a subtitle bar.
   */
  card: [
    { height: skHeightThumbnail, borderRadius: skRadiusMd },
    { height: skHeightTextLg, width: '75%' },
    { height: skHeightTextMd, width: '50%' },
  ],

  /**
   * List preset — mimics a list of items, each with an avatar
   * circle and two text lines.
   */
  list: [
    { height: skSizeAvatarMd, width: skSizeAvatarMd, circle: true },
    { height: skHeightTextMd, width: '60%' },
    { height: skHeightTextSm, width: '40%' },
  ],

  /**
   * Detail preset — mimics a detail / profile view with a large
   * banner, a heading, and multiple body-text lines.
   */
  detail: [
    { height: skHeightDetailBanner, borderRadius: skRadiusLg },
    { height: skHeightHeading, width: '60%' },
    { height: skHeightTextMd, width: '90%' },
    { height: skHeightTextMd, width: '80%' },
    { height: skHeightTextSm, width: '45%' },
  ],
};
