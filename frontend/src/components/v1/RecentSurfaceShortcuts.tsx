/**
 * RecentSurfaceShortcuts — keyboard-navigable shortcut list of recently
 * visited *surfaces* (other wallet addresses, other contract IDs, other
 * detail pages) the user has touched recently.
 *
 * Why a new component when `RecentItemsRail` already exists:
 * - `RecentItemsRail` is a horizontal scrollable activity feed; it's
 *   tuned for a stream of items with timestamps.
 * - `RecentSurfaceShortcuts` is a compact navigation aid for *related
 *   surfaces of the same kind* — the wallet detail page shows the user's
 *   other recent wallet addresses; the contract detail page shows other
 *   recent contracts. It deliberately renders as a tight list of links so
 *   keyboard users can jump between adjacent surfaces with arrow keys.
 *
 * Acceptance criteria covered (#788):
 * - Reachable through a clear user entry point (rendered inline on wallet
 *   + contract detail pages).
 * - Responsive: list collapses to a single column on narrow viewports via
 *   `flex-wrap`.
 * - Accessibility: nav landmark with an `aria-label`, focusable `<a>` /
 *   `<button>` shortcuts, arrow-key handler on the list to advance focus.
 * - Empty / loading / disabled states explicit (see props).
 */

import React, { useCallback, useId, useRef } from "react";
import "./RecentSurfaceShortcuts.css";

export interface RecentSurfaceShortcut {
  id: string;
  label: string;
  /**
   * Optional secondary descriptor — the address suffix, contract version,
   * etc. Rendered in a muted style next to the label.
   */
  hint?: string;
  /**
   * If supplied, the shortcut renders as an `<a>` tag for native
   * navigation; otherwise it renders as a `<button>` so the caller can
   * intercept the click (e.g. for in-app routing).
   */
  href?: string;
  /** Disable a specific shortcut without removing it from the list. */
  disabled?: boolean;
}

export interface RecentSurfaceShortcutsProps {
  /** The shortcuts to render. */
  items: RecentSurfaceShortcut[];
  /** Surface kind for the section heading and accessible label. */
  surfaceKind: "wallet" | "contract";
  /** Called on click / Enter when a shortcut doesn't have an `href`. */
  onSelect?: (item: RecentSurfaceShortcut) => void;
  /** Show a skeleton while parent data resolves. */
  isLoading?: boolean;
  /** Override empty-state copy. */
  emptyMessage?: string;
  /** Cap displayed items (defaults to 6). */
  maxItems?: number;
  className?: string;
  testId?: string;
}

const SURFACE_LABEL: Record<
  RecentSurfaceShortcutsProps["surfaceKind"],
  { heading: string; aria: string; empty: string }
> = {
  wallet: {
    heading: "Recent wallets",
    aria: "Recent wallet shortcuts",
    empty: "No other wallets visited yet.",
  },
  contract: {
    heading: "Recent contracts",
    aria: "Recent contract shortcuts",
    empty: "No other contracts visited yet.",
  },
};

const DEFAULT_MAX = 6;

const RecentSurfaceShortcuts: React.FC<RecentSurfaceShortcutsProps> = ({
  items,
  surfaceKind,
  onSelect,
  isLoading = false,
  emptyMessage,
  maxItems = DEFAULT_MAX,
  className,
  testId,
}) => {
  const headingId = useId();
  const labels = SURFACE_LABEL[surfaceKind];
  const listRef = useRef<HTMLUListElement | null>(null);

  // Cap + drop empty rows; preserve insertion order so the most recent
  // surfaces stay at the top.
  const visible = items.slice(0, Math.max(0, maxItems));

  const handleKeyDown = useCallback((event: React.KeyboardEvent<HTMLUListElement>) => {
    if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;
    const container = listRef.current;
    if (!container) return;

    const focusables = Array.from(
      container.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled])'
      )
    );
    if (focusables.length === 0) return;

    const currentIndex = focusables.indexOf(
      document.activeElement as HTMLElement
    );
    const nextIndex =
      event.key === "ArrowDown"
        ? Math.min(focusables.length - 1, currentIndex + 1)
        : Math.max(0, currentIndex - 1);

    if (nextIndex !== currentIndex && nextIndex >= 0) {
      event.preventDefault();
      focusables[nextIndex].focus();
    }
  }, []);

  const renderEmpty = () => (
    <p className="recent-surface-shortcuts__empty" aria-live="polite">
      {emptyMessage ?? labels.empty}
    </p>
  );

  const renderLoading = () => (
    <ul
      className="recent-surface-shortcuts__list recent-surface-shortcuts__list--loading"
      aria-hidden="true"
    >
      {Array.from({ length: 3 }).map((_, i) => (
        <li key={`shortcut-skeleton-${i}`} className="recent-surface-shortcuts__skeleton" />
      ))}
    </ul>
  );

  return (
    <nav
      className={`recent-surface-shortcuts${className ? ` ${className}` : ""}`}
      aria-labelledby={headingId}
      data-testid={testId}
    >
      <h3 id={headingId} className="recent-surface-shortcuts__heading">
        {labels.heading}
      </h3>
      {isLoading ? (
        renderLoading()
      ) : visible.length === 0 ? (
        renderEmpty()
      ) : (
        <ul
          ref={listRef}
          className="recent-surface-shortcuts__list"
          aria-label={labels.aria}
          onKeyDown={handleKeyDown}
        >
          {visible.map(item => (
            <li key={item.id} className="recent-surface-shortcuts__item">
              {item.href ? (
                <a
                  className="recent-surface-shortcuts__shortcut"
                  href={item.href}
                  aria-disabled={item.disabled || undefined}
                  tabIndex={item.disabled ? -1 : 0}
                  onClick={event => {
                    if (item.disabled) {
                      event.preventDefault();
                      return;
                    }
                  }}
                >
                  <span className="recent-surface-shortcuts__label">
                    {item.label}
                  </span>
                  {item.hint && (
                    <span className="recent-surface-shortcuts__hint">
                      {item.hint}
                    </span>
                  )}
                </a>
              ) : (
                <button
                  type="button"
                  className="recent-surface-shortcuts__shortcut"
                  disabled={item.disabled}
                  onClick={() => onSelect?.(item)}
                >
                  <span className="recent-surface-shortcuts__label">
                    {item.label}
                  </span>
                  {item.hint && (
                    <span className="recent-surface-shortcuts__hint">
                      {item.hint}
                    </span>
                  )}
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </nav>
  );
};

export default RecentSurfaceShortcuts;
