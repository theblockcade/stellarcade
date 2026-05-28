/**
 * NoResultsStateShell — reusable empty-state shell for filtered feeds
 * and tables (#830).
 *
 * Distinct from the existing `DashboardEmptyPanelShell` (which is for
 * a section that has never had data) and `EmptyHintRow` (which is a
 * single-row hint inside a table). This component is for the
 * *post-filter* state — the dataset isn't empty, but the user's
 * current filters produced zero results. Surfaces:
 *  - a title, optional explanation,
 *  - the active filter chips (so the user sees *what* eliminated
 *    everything), with one-tap clear handlers,
 *  - a "Clear all filters" primary action (suppressed when there are
 *    no filters to clear),
 *  - an optional secondary action slot.
 *
 * Designed to slot into both feeds and tables: the wrapper is just a
 * `<div role="status">` so the host layout decides on min-height,
 * padding, and table-row vs panel placement.
 */

import React from "react";
import "./NoResultsStateShell.css";

export interface NoResultsActiveFilter {
    /** Stable id so the clear handler knows which filter to drop. */
    id: string;
    /** Display label. */
    label: string;
    /** Optional value to show after the label (e.g. "Status: Open"). */
    value?: string;
    /** Hide the chip's clear button (for filters that aren't dismissable). */
    locked?: boolean;
}

export interface NoResultsStateShellProps {
    /** Heading copy. */
    title?: string;
    /** Optional supporting paragraph. */
    description?: string;
    /**
     * Active filters whose chips render with a per-filter "✕" clear
     * affordance. When empty, the "Clear all filters" button is
     * suppressed (acceptance: empty / loading / disabled / missing-
     * data states explicit).
     */
    filters?: NoResultsActiveFilter[];
    /** Per-filter clear handler. */
    onClearFilter?: (id: string) => void;
    /** Bulk clear handler — called when the primary action is clicked. */
    onClearAll?: () => void;
    /**
     * Custom primary-action label override (default "Clear all
     * filters"). Useful when the host wants a domain-specific verb.
     */
    clearAllLabel?: string;
    /** Optional secondary action slot — fills below the primary CTA. */
    secondaryAction?: React.ReactNode;
    /** Disable the primary action (e.g. while a refetch is in flight). */
    disabled?: boolean;
    className?: string;
    /** Optional test id passthrough. */
    testId?: string;
}

const DEFAULT_TITLE = "No matches found";
const DEFAULT_DESCRIPTION =
    "Adjust your filters or clear them to see the rest of the feed.";

const NoResultsStateShell: React.FC<NoResultsStateShellProps> = ({
    title = DEFAULT_TITLE,
    description = DEFAULT_DESCRIPTION,
    filters,
    onClearFilter,
    onClearAll,
    clearAllLabel = "Clear all filters",
    secondaryAction,
    disabled = false,
    className,
    testId,
}) => {
    const activeFilters = filters ?? [];
    const dismissibleFilters = activeFilters.filter(f => !f.locked);
    const canClearAll =
        !disabled && dismissibleFilters.length > 0 && typeof onClearAll === "function";

    return (
        <div
            role="status"
            aria-live="polite"
            data-testid={testId}
            className={
                "no-results-shell" + (className ? ` ${className}` : "")
            }
        >
            <div className="no-results-shell__body">
                <p className="no-results-shell__title">{title}</p>
                {description && (
                    <p className="no-results-shell__description">{description}</p>
                )}
                {activeFilters.length > 0 && (
                    <ul
                        className="no-results-shell__filters"
                        aria-label="Active filters"
                    >
                        {activeFilters.map(filter => (
                            <li
                                key={filter.id}
                                className="no-results-shell__filter-chip"
                            >
                                <span className="no-results-shell__filter-label">
                                    {filter.label}
                                </span>
                                {filter.value !== undefined && (
                                    <span className="no-results-shell__filter-value">
                                        {filter.value}
                                    </span>
                                )}
                                {!filter.locked && onClearFilter && (
                                    <button
                                        type="button"
                                        className="no-results-shell__filter-clear"
                                        onClick={() => onClearFilter(filter.id)}
                                        aria-label={`Clear filter: ${filter.label}`}
                                    >
                                        ✕
                                    </button>
                                )}
                            </li>
                        ))}
                    </ul>
                )}
                <div className="no-results-shell__actions">
                    {canClearAll && (
                        <button
                            type="button"
                            className="no-results-shell__action no-results-shell__action--primary"
                            onClick={onClearAll}
                        >
                            {clearAllLabel}
                        </button>
                    )}
                    {secondaryAction && (
                        <div className="no-results-shell__secondary">
                            {secondaryAction}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default NoResultsStateShell;
