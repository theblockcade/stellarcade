"use client";

/**
 * HeadingHierarchyRegion — heading hierarchy safeguard for nested dashboard regions.
 */

import React, { createContext, useContext, useMemo } from "react";

export type HeadingLevel = 1 | 2 | 3 | 4 | 5 | 6;

interface HeadingHierarchyContextValue {
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
    level?: HeadingLevel;
    as?: keyof Pick<React.JSX.IntrinsicElements, "section" | "div" | "article" | "aside" | "main">;
    className?: string;
    role?: string;
    children?: React.ReactNode;
}

export const HeadingHierarchyRegion: React.FC<HeadingHierarchyRegionProps> = ({
    level,
    as = "section",
    className,
    role,
    children,
}) => {
    const parent = useContext(HeadingHierarchyContext);
    const nextLevel: HeadingLevel = useMemo(() => {
        if (level != null) return clampLevel(level + 1);
        if (parent) return clampLevel(parent.nextLevel + 1);
        return 2;
    }, [level, parent]);

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
    levelOverride?: HeadingLevel;
    children?: React.ReactNode;
}

export const RegionHeading: React.FC<RegionHeadingProps> = ({
    levelOverride,
    children,
    ...rest
}) => {
    const ctx = useContext(HeadingHierarchyContext);
    const level = clampLevel(levelOverride ?? ctx?.nextLevel ?? 2);
    return React.createElement(
        `h${level}` as keyof React.JSX.IntrinsicElements,
        rest,
        children
    );
};

export const __HEADING_CONTEXT_FOR_TEST = HeadingHierarchyContext;
