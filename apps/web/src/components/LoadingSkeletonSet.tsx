import React from "react";
import {
  classNames,
  parseDimension,
  useReducedMotion,
} from "../utils/skeletonUtils";
import {
  SKELETON_PRESETS,
  skRadiusSm,
  skRadiusMd,
  skRadiusLg,
  type SkeletonPresetType,
} from "./skeleton.tokens";

/*
 * Styling moved from LoadingSkeletonSet.css to Tailwind utilities; the
 * `stellarcade-skeleton*` class names are kept as query/test hooks only. The
 * shimmer keyframes now live in app/globals.css as the theme animation
 * `animate-skeleton-shimmer`.
 */

/** The shimmering bar itself — a moving gradient over a 200%-wide backdrop. */
const SKELETON_SURFACE =
  "border border-white/5 bg-[linear-gradient(90deg,rgba(255,255,255,0.04)_0%,rgba(0,255,204,0.08)_50%,rgba(255,255,255,0.04)_100%)] bg-[length:200%_100%] " +
  "animate-skeleton-shimmer motion-reduce:animate-none motion-reduce:opacity-60";

const SKELETON_CARD =
  "stellarcade-skeleton-card flex flex-col gap-4 rounded-[0.875rem] border border-white/8 bg-card p-6 backdrop-blur-md";

export interface SkeletonBaseProps extends React.HTMLAttributes<HTMLDivElement> {
  width?: string | number;
  height?: string | number;
  borderRadius?: string | number;
  className?: string;
  circle?: boolean;
}

/**
 * Maps a token radius value to the corresponding utility class name.
 * Falls back to inline style when the value doesn't match a known token.
 */
function radiusTokenClass(radius?: string | number): string | undefined {
  if (radius === undefined) return undefined;
  const str = typeof radius === "number" ? `${radius}px` : radius;
  if (str === "50%") return "stellarcade-skeleton--radius-circle rounded-full";
  if (str === skRadiusSm) return "stellarcade-skeleton--radius-sm rounded-md";
  if (str === skRadiusMd) return "stellarcade-skeleton--radius-md rounded-[0.625rem]";
  if (str === skRadiusLg) return "stellarcade-skeleton--radius-lg rounded-[0.875rem]";
  return undefined;
}

export function SkeletonBase({
  width,
  height,
  borderRadius,
  className,
  circle,
  style,
  ...rest
}: SkeletonBaseProps) {
  const resolvedRadius = circle ? "50%" : borderRadius;
  const tokenCls = radiusTokenClass(
    circle
      ? "50%"
      : typeof resolvedRadius === "string"
        ? resolvedRadius
        : undefined,
  );
  const reducedMotion = useReducedMotion();

  return (
    <div
      className={classNames(
        "stellarcade-skeleton",
        "stellarcade-skeleton-base",
        SKELETON_SURFACE,
        tokenCls ?? "rounded-md",
        reducedMotion
          ? "stellarcade-skeleton--no-motion animate-none opacity-60"
          : undefined,
        className,
      )}
      style={{
        width: parseDimension(width),
        height: parseDimension(height) || "1rem",
        borderRadius: tokenCls ? undefined : parseDimension(resolvedRadius),
        ...style,
      }}
      data-testid="skeleton-base"
      data-reduced-motion={reducedMotion ? "true" : undefined}
      {...rest}
    />
  );
}

export interface SkeletonCardProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
  children?: React.ReactNode;
}

export function SkeletonCard({
  className,
  children,
  ...rest
}: SkeletonCardProps) {
  return (
    <div
      className={classNames(SKELETON_CARD, className)}
      data-testid="skeleton-card"
      {...rest}
    >
      {children ? (
        children
      ) : (
        <>
          <SkeletonBase height="150px" borderRadius="0.5rem" />
          <SkeletonBase height="24px" width="75%" />
          <SkeletonBase height="16px" width="50%" />
        </>
      )}
    </div>
  );
}

export interface SkeletonRowProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
  avatarSize?: string | number;
}

export function SkeletonRow({
  className,
  avatarSize = "40px",
  ...rest
}: SkeletonRowProps) {
  return (
    <div
      className={classNames("stellarcade-skeleton-row flex items-center gap-4 rounded-[0.625rem] border border-white/8 bg-white/2 px-4 py-3", className)}
      data-testid="skeleton-row"
      {...rest}
    >
      <SkeletonBase width={avatarSize} height={avatarSize} circle />
      <div className="flex flex-1 flex-col gap-2">
        <SkeletonBase height="16px" width="60%" />
        <SkeletonBase height="12px" width="40%" />
      </div>
    </div>
  );
}

export interface SkeletonListProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
  count?: number;
  type?: "row" | "card";
}

export function SkeletonList({
  className,
  count = 3,
  type = "row",
  ...rest
}: SkeletonListProps) {
  return (
    <div
      className={classNames("stellarcade-skeleton-list flex flex-col gap-2", className)}
      data-testid="skeleton-list"
      {...rest}
    >
      {Array.from({ length: Math.max(0, count) }).map((_, i) =>
        type === "row" ? (
          <SkeletonRow key={`skeleton-row-${i}`} />
        ) : (
          <SkeletonCard key={`skeleton-card-${i}`} />
        ),
      )}
    </div>
  );
}

// ── SkeletonPreset ──────────────────────────────────────────────────

export interface SkeletonPresetProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Which named preset to render. */
  type: SkeletonPresetType;
  className?: string;
}

/**
 * Renders a named loading preset (`card`, `list`, or `detail`).
 *
 * Each preset is defined in `skeleton.tokens.ts` as an array of
 * `SkeletonShape` objects that are mapped to `SkeletonBase` elements.
 *
 * @example
 * ```tsx
 * <SkeletonPreset type="card" />
 * <SkeletonPreset type="detail" />
 * ```
 */
export function SkeletonPreset({
  type,
  className,
  ...rest
}: SkeletonPresetProps) {
  const shapes = SKELETON_PRESETS[type];

  return (
    <div
      className={classNames(
        "stellarcade-skeleton-preset flex flex-col",
        type === "detail"
          ? `${SKELETON_CARD} gap-6`
          : type === "card"
            ? SKELETON_CARD
            : "gap-2",
        `stellarcade-skeleton-preset--${type}`,
        className,
      )}
      data-testid={`skeleton-preset-${type}`}
      {...rest}
    >
      {shapes.map((shape, i) => (
        <SkeletonBase
          key={`preset-${type}-${i}`}
          width={shape.width}
          height={shape.height}
          borderRadius={shape.borderRadius}
          circle={shape.circle}
        />
      ))}
    </div>
  );
}

// ── LoadingState ────────────────────────────────────────────────────

export interface LoadingStateProps {
  isLoading: boolean;
  error?: Error | null;
  empty?: boolean;
  children: React.ReactNode;
  /** Custom fallback element for the loading state. */
  fallback?: React.ReactNode;
  /** Use a named preset as the loading fallback (ignored when `fallback` is set). */
  preset?: SkeletonPresetType;
  errorFallback?: (error: Error) => React.ReactNode;
  emptyFallback?: React.ReactNode;
}

export function LoadingState({
  isLoading,
  error,
  empty,
  children,
  fallback,
  preset,
  errorFallback,
  emptyFallback,
}: LoadingStateProps) {
  if (error) {
    if (errorFallback) return <>{errorFallback(error)}</>;
    return (
      <div className="stellarcade-error-state rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-rose-300" data-testid="skeleton-error">
        Failed to load data: {error.message}
      </div>
    );
  }

  if (isLoading) {
    if (fallback) return <>{fallback}</>;
    if (preset) return <SkeletonPreset type={preset} />;
    return <SkeletonList count={3} />;
  }

  if (empty) {
    if (emptyFallback) return <>{emptyFallback}</>;
    return (
      <div className="stellarcade-empty-state rounded-xl border border-border bg-card/40 px-4 py-6 text-center text-sm text-muted-foreground" data-testid="skeleton-empty">
        No data available
      </div>
    );
  }

  return <>{children}</>;
}

export type PageSkeletonSurfaceStatus = "loading" | "ready" | "error" | "empty";

export interface PageSkeletonSurface {
  id: string;
  label: string;
  status: PageSkeletonSurfaceStatus;
  content: React.ReactNode;
  loadingFallback?: React.ReactNode;
  errorFallback?: React.ReactNode;
  emptyFallback?: React.ReactNode;
}

export interface PageSkeletonOrchestratorProps extends React.HTMLAttributes<HTMLDivElement> {
  surfaces: PageSkeletonSurface[];
  className?: string;
  testId?: string;
}

function renderSurface(surface: PageSkeletonSurface): React.ReactNode {
  if (surface.status === "loading") {
    return surface.loadingFallback ?? <SkeletonPreset type="card" />;
  }

  if (surface.status === "error") {
    return (
      surface.errorFallback ?? (
        <div className="stellarcade-error-state rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-rose-300" role="alert">
          {surface.label} could not be loaded.
        </div>
      )
    );
  }

  if (surface.status === "empty") {
    return (
      surface.emptyFallback ?? (
        <div className="stellarcade-empty-state rounded-xl border border-border bg-card/40 px-4 py-6 text-center text-sm text-muted-foreground">
          No {surface.label.toLowerCase()} available
        </div>
      )
    );
  }

  return surface.content;
}

export function PageSkeletonOrchestrator({
  surfaces,
  className,
  testId = "page-skeleton-orchestrator",
  ...rest
}: PageSkeletonOrchestratorProps) {
  const loadingCount = surfaces.filter(
    (surface) => surface.status === "loading",
  ).length;
  const isLoading = loadingCount > 0;

  return (
    <div
      className={classNames(
        "stellarcade-page-skeleton-orchestrator flex flex-col gap-4",
        className,
      )}
      aria-busy={isLoading}
      data-testid={testId}
      data-loading-count={loadingCount}
      {...rest}
    >
      <span
        className="stellarcade-page-skeleton-orchestrator__status sr-only"
        role="status"
        aria-live="polite"
      >
        {isLoading
          ? `Loading ${loadingCount} page ${loadingCount === 1 ? "section" : "sections"}.`
          : ""}
      </span>
      {surfaces.map((surface) => (
        <React.Fragment key={surface.id}>
          {renderSurface(surface)}
        </React.Fragment>
      ))}
    </div>
  );
}
