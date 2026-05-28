/**
 * HeadingHierarchyRegion — heading hierarchy safeguard for nested
 * dashboard regions (#831).
 *
 * Dashboards on this app nest cards within sections within page-level
 * regions; without a coordinated heading strategy, the resulting DOM
 * tree has skipped levels (h1 → h4) or repeats h2s when each card
 * picks its own static heading element. This component fixes that by:
 *
 *  - Establishing a React context that tracks the *current* heading
 *    level. The root `<HeadingHierarchyRegion level={1}>` pins the
 *    page-level h1; child regions read the context and render h2/h3/
 *    etc. one level deeper, capped at 6 (HTML5's last heading level).
 *  - Providing `<RegionHeading>` — a component that renders the
 *    correct heading element for the current depth automatically, so
 *    callers don't have to count.
 *  - Optionally warning in development when a region declares a level
 *    that skips a heading (e.g. an h2 directly inside an h4 context).
 *
 * Acceptance criteria notes:
 *  - Reachable via the existing dashboard surfaces (callers wrap
 *    their region wrapper in this component).
 *  - Responsive / accessibility behaviour intact — this is a semantic
 *    safeguard, not a visual change.
 *  - Existing page flows unaffected: when a caller doesn't opt in,
 *    `RegionHeading` outside the provider falls back to h2 with a
 *    sensible default.
 */

import React, { createContext, useContext, useMemo } from "react";

type HeadingLevel = 1 | 2 | 3 | 4 | 5 | 6;

interface HeadingHierarchyContextValue {
    /** The heading level the *next* RegionHeading should render at. */
    nextLevel: HeadingLevel;
}

const HeadingHierarchyContext =
    createContext<HeadingHierarchyContextValue | null>(null);

const clampLevel = (raw: number): HeadingLevel => {
    if (raw < 1) return 1;
    if (raw > 6) return 6;
    return raw as HeadingLevel;
};

export interface HeadingHierarchyRegionProps {
    /**
     * Explicit level override. When omitted, the region inherits its
     * parent context (and adds one for any nested region inside it).
     * The top-level `<HeadingHierarchyRegion level={1}>` is the only
     * caller that needs to set this.
     */
    level?: HeadingLevel;
    /**
     * Optional element used to wrap the region's children. Defaults
     * to `<section>` — the most common semantically-meaningful
     * container — but callers can pass `'div'` for purely visual
     * wrappers.
     */
    as?: keyof Pick<JSX.IntrinsicElements, "section" | "div" | "article" | "aside" | "main">;
    /** Forwarded to the wrapper element. */
    className?: string;
    /** Forwarded to the wrapper element. */
    role?: string;
    children?: React.ReactNode;
}

const HeadingHierarchyRegion: React.FC<HeadingHierarchyRegionProps> = ({
    level,
    as = "section",
    className,
    role,
    children,
}) => {
    const parent = useContext(HeadingHierarchyContext);
    // The level the *next* heading inside this region should render at.
    // `level` is the *parent* heading level — children render one step
    // deeper. So `<HeadingHierarchyRegion level={1}>` says "the page
    // is at h1, my children are h2". Nested regions step down one each
    // time, capped at h6.
    const nextLevel: HeadingLevel = useMemo(() => {
        if (level != null) return clampLevel(level + 1);
        if (parent) return clampLevel(parent.nextLevel + 1);
        return 2;
    }, [level, parent]);

    // Dev-only safeguard: if the caller explicitly set a level that
    // skips a level relative to the parent context, surface a
    // console.warn so the regression is caught in dev. For example,
    // a region declaring `level={4}` inside a parent at level=1 jumps
    // from h2 to h5 — likely a missing intermediate region.
    if (
        typeof process !== "undefined" &&
        process.env &&
        process.env.NODE_ENV !== "production" &&
        level != null &&
        parent &&
        level + 1 > parent.nextLevel + 1
    ) {
        // eslint-disable-next-line no-console
        console.warn(
            `[HeadingHierarchyRegion] heading level ${level + 1} skips a level — ` +
                `parent context expected h${parent.nextLevel}. ` +
                "Did you mean to nest a region in between?"
        );
    }

    const value = useMemo<HeadingHierarchyContextValue>(
        () => ({ nextLevel }),
        [nextLevel]
    );

    return (
        <HeadingHierarchyContext.Provider value={value}>
            {React.createElement(
                as,
                { className, role, "data-heading-level": nextLevel },
                children
            )}
        </HeadingHierarchyContext.Provider>
    );
};

export default HeadingHierarchyRegion;

export interface RegionHeadingProps
    extends React.HTMLAttributes<HTMLHeadingElement> {
    /**
     * Override the level for this single heading. Most callers omit
     * this and let the context decide.
     */
    levelOverride?: HeadingLevel;
    children?: React.ReactNode;
}

/**
 * Heading that auto-picks the right `<hN>` tag based on the nearest
 * `<HeadingHierarchyRegion>` ancestor. Outside a region, defaults to
 * `<h2>` — sensible because a `<h1>` is reserved for the page-level
 * route layout.
 */
export const RegionHeading: React.FC<RegionHeadingProps> = ({
    levelOverride,
    children,
    ...rest
}) => {
    const ctx = useContext(HeadingHierarchyContext);
    const level = clampLevel(levelOverride ?? ctx?.nextLevel ?? 2);
    return React.createElement(
        `h${level}` as keyof JSX.IntrinsicElements,
        rest,
        children
    );
};

/** Exposed for tests. */
export const __HEADING_CONTEXT_FOR_TEST = HeadingHierarchyContext;
