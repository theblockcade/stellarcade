/**
 * QueueReadinessChip — live queue-readiness indicator for multiplayer
 * entry cards (#832).
 *
 * Lives next to an entry's CTA on the multiplayer surface so players
 * can see at a glance whether the queue is ready to drop them in.
 * Five canonical states map to small visual tokens (color, icon, copy):
 *
 *  - `idle`       — queue is open but no one is waiting.
 *  - `forming`    — players are joining but the match isn't ready yet.
 *  - `ready`      — enough players, the lobby is forming now.
 *  - `disabled`   — queue is paused / locked at the entry level.
 *  - `unavailable` — the entry is offline / data not loaded yet.
 *
 * Acceptance criteria notes:
 *  - Reachable on the multiplayer entry card (callers render it inline).
 *  - Responsive: just a flex inline; truncates label on narrow widths.
 *  - Accessibility: `role="status"`, `aria-live="polite"` so SR users
 *    hear the queue state updates without it stealing focus. The chip
 *    itself is not a button — clicks on the surrounding card still
 *    work because the chip carries `pointer-events: none` on the icon
 *    by default and the wrapper is non-interactive.
 *  - Handles empty / loading / disabled explicitly via the `state` enum.
 */

import React, { useMemo } from "react";
import "./QueueReadinessChip.css";

export type QueueReadinessState =
    | "idle"
    | "forming"
    | "ready"
    | "disabled"
    | "unavailable";

export interface QueueReadinessChipProps {
    state: QueueReadinessState;
    /** Optional override for the label text. */
    label?: string;
    /**
     * Optional waiting-count badge. When provided and >0, surfaces a
     * small "N waiting" suffix on the `forming` / `idle` chips.
     */
    queuedCount?: number;
    /**
     * Hide the visible label entirely; the chip still announces its
     * state via the `aria-label`. Useful in very narrow card layouts.
     */
    iconOnly?: boolean;
    className?: string;
    /** Test id passthrough. */
    testId?: string;
}

const STATE_CONFIG: Record<
    QueueReadinessState,
    { label: string; tone: string; icon: string; ariaText: string }
> = {
    idle: {
        label: "Queue open",
        tone: "queue-readiness-chip--idle",
        icon: "○",
        ariaText: "Queue open, no players waiting yet",
    },
    forming: {
        label: "Filling",
        tone: "queue-readiness-chip--forming",
        icon: "◌",
        ariaText: "Players joining, match forming",
    },
    ready: {
        label: "Match ready",
        tone: "queue-readiness-chip--ready",
        icon: "●",
        ariaText: "Match ready, dropping in",
    },
    disabled: {
        label: "Queue paused",
        tone: "queue-readiness-chip--disabled",
        icon: "—",
        ariaText: "Queue paused",
    },
    unavailable: {
        label: "Unavailable",
        tone: "queue-readiness-chip--unavailable",
        icon: "?",
        ariaText: "Queue status unavailable",
    },
};

const QueueReadinessChip: React.FC<QueueReadinessChipProps> = ({
    state,
    label,
    queuedCount,
    iconOnly = false,
    className,
    testId,
}) => {
    const config = STATE_CONFIG[state];

    const visibleLabel = label ?? config.label;
    const showCount =
        typeof queuedCount === "number" &&
        queuedCount > 0 &&
        (state === "forming" || state === "idle");

    const ariaLabel = useMemo(() => {
        const base = label ? `${label}.` : config.ariaText + ".";
        return showCount ? `${base} ${queuedCount} waiting.` : base;
    }, [config.ariaText, label, queuedCount, showCount]);

    return (
        <span
            role="status"
            aria-live="polite"
            aria-label={ariaLabel}
            data-testid={testId}
            data-state={state}
            className={
                "queue-readiness-chip " +
                config.tone +
                (className ? ` ${className}` : "")
            }
        >
            <span className="queue-readiness-chip__icon" aria-hidden="true">
                {config.icon}
            </span>
            {!iconOnly && (
                <span className="queue-readiness-chip__label">
                    {visibleLabel}
                </span>
            )}
            {showCount && (
                <span className="queue-readiness-chip__count">
                    {queuedCount}
                </span>
            )}
        </span>
    );
};

export default QueueReadinessChip;
