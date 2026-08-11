"use client";

import React, { useId } from "react";
import "./RecentSurfaceShortcuts.css";

export interface RecentSurfaceShortcut {
  id: string;
  label: string;
  hint?: string;
  href?: string;
  disabled?: boolean;
}

export interface RecentSurfaceShortcutsProps {
  items: RecentSurfaceShortcut[];
  surfaceKind: "wallet" | "contract";
  onSelect?: (item: RecentSurfaceShortcut) => void;
  isLoading?: boolean;
  emptyMessage?: string;
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

export const RecentSurfaceShortcuts: React.FC<RecentSurfaceShortcutsProps> = ({
  items,
  surfaceKind,
  onSelect,
  isLoading = false,
  emptyMessage,
  maxItems = DEFAULT_MAX,
  className,
  testId = "recent-surface-shortcuts",
}) => {
  const headingId = useId();
  const labels = SURFACE_LABEL[surfaceKind];
  const visible = items.slice(0, Math.max(0, maxItems));

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
        <div data-testid={`${testId}-loading`}>Loading...</div>
      ) : visible.length === 0 ? (
        <p className="recent-surface-shortcuts__empty" data-testid={`${testId}-empty`}>
          {emptyMessage ?? labels.empty}
        </p>
      ) : (
        <ul className="recent-surface-shortcuts__list" aria-label={labels.aria}>
          {visible.map((item) => (
            <li key={item.id} className="recent-surface-shortcuts__item">
              {item.href ? (
                <a
                  className="recent-surface-shortcuts__shortcut"
                  href={item.href}
                  data-testid={`${testId}-item-${item.id}`}
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
                  data-testid={`${testId}-item-${item.id}`}
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
