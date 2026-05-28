import React, { useCallback, useEffect, useId, useRef, useState } from "react";
import "./TableRowActionOverflowMenu.css";

/**
 * Table row action overflow menu (#565).
 *
 * Drop-in for dense data views: collapses N row actions into a single
 * "More" trigger and surfaces them in a popover list. Keyboard accessible
 * (arrow keys + Enter), closes on Escape / outside-click / blur, and
 * handles the "no actions provided" / "all actions disabled" edge cases
 * explicitly so callers don't need to gate the trigger.
 */
export type OverflowItemTone = "default" | "danger";

export interface TableRowActionOverflowItem {
  id: string;
  label: string;
  /** Triggered when the item is selected. */
  onSelect: () => void | Promise<void>;
  /** Visual tone — `danger` colours destructive actions. */
  tone?: OverflowItemTone;
  /** Disable a specific action without removing it from the list. */
  disabled?: boolean;
  /** Optional leading icon. */
  icon?: React.ReactNode;
  /** Render a divider above this item; useful between groups. */
  divider?: boolean;
}

export interface TableRowActionOverflowMenuProps {
  items: TableRowActionOverflowItem[];
  /** Optional label for the trigger (announced by screen readers). */
  triggerLabel?: string;
  /** Disables the trigger entirely. */
  disabled?: boolean;
  /** Optional override for `data-testid` on the trigger. */
  testId?: string;
  className?: string;
}

export function TableRowActionOverflowMenu({
  items,
  triggerLabel = "Row actions",
  disabled = false,
  testId = "table-row-action-overflow",
  className = "",
}: TableRowActionOverflowMenuProps): React.JSX.Element {
  const [open, setOpen] = useState(false);
  const [activeIdx, setActiveIdx] = useState(0);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const menuId = useId();

  const enabledItemIndices = items
    .map((item, idx) => ({ item, idx }))
    .filter(({ item }) => !item.disabled);

  const close = useCallback(() => {
    setOpen(false);
    setActiveIdx(0);
  }, []);

  // Close on outside click + Escape so the menu doesn't stay attached when
  // the user navigates away by other means.
  useEffect(() => {
    if (!open) return;
    const onDocumentClick = (event: MouseEvent) => {
      const target = event.target as Node | null;
      if (target && wrapperRef.current && !wrapperRef.current.contains(target)) {
        close();
      }
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        close();
      }
    };
    document.addEventListener("mousedown", onDocumentClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocumentClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, close]);

  const moveActive = useCallback(
    (delta: 1 | -1) => {
      if (enabledItemIndices.length === 0) return;
      setActiveIdx((prev) => {
        const currentEnabledPos = Math.max(
          0,
          enabledItemIndices.findIndex(({ idx }) => idx === prev),
        );
        const nextEnabledPos =
          (currentEnabledPos + delta + enabledItemIndices.length) %
          enabledItemIndices.length;
        return enabledItemIndices[nextEnabledPos]!.idx;
      });
    },
    [enabledItemIndices],
  );

  const handleTriggerKey = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === "ArrowDown" || e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      setOpen(true);
      const firstEnabled = enabledItemIndices[0]?.idx ?? 0;
      setActiveIdx(firstEnabled);
    }
  };

  const handleMenuKey = (e: React.KeyboardEvent<HTMLUListElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      moveActive(1);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      moveActive(-1);
    } else if (e.key === "Home") {
      e.preventDefault();
      const first = enabledItemIndices[0]?.idx;
      if (first !== undefined) setActiveIdx(first);
    } else if (e.key === "End") {
      e.preventDefault();
      const last = enabledItemIndices[enabledItemIndices.length - 1]?.idx;
      if (last !== undefined) setActiveIdx(last);
    } else if (e.key === "Enter") {
      e.preventDefault();
      const item = items[activeIdx];
      if (item && !item.disabled) {
        void runAction(item);
      }
    }
  };

  const runAction = async (item: TableRowActionOverflowItem) => {
    close();
    await item.onSelect();
  };

  return (
    <div
      ref={wrapperRef}
      className={`tr-action-overflow ${className}`.trim()}
      data-testid={testId}
    >
      <button
        type="button"
        aria-label={triggerLabel}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        className="tr-action-overflow__trigger"
        disabled={disabled || items.length === 0}
        data-testid={`${testId}-trigger`}
        onClick={() => {
          if (open) {
            close();
          } else {
            setOpen(true);
            const firstEnabled = enabledItemIndices[0]?.idx ?? 0;
            setActiveIdx(firstEnabled);
          }
        }}
        onKeyDown={handleTriggerKey}
      >
        {/* Vertical ellipsis */}
        <span aria-hidden="true">⋮</span>
      </button>

      {open && (
        <ul
          id={menuId}
          role="menu"
          tabIndex={-1}
          ref={(node) => {
            // Move focus into the menu when it opens so arrow keys work
            // immediately without an extra click.
            if (node) node.focus();
          }}
          aria-label={triggerLabel}
          className="tr-action-overflow__menu"
          data-testid={`${testId}-menu`}
          onKeyDown={handleMenuKey}
        >
          {items.length === 0 ? (
            <li
              className="tr-action-overflow__empty"
              data-testid={`${testId}-empty`}
            >
              No actions available
            </li>
          ) : (
            items.map((item, idx) => (
              <React.Fragment key={item.id}>
                {item.divider && idx > 0 && (
                  <hr aria-hidden="true" className="tr-action-overflow__divider" />
                )}
                <li role="none">
                  <button
                    type="button"
                    role="menuitem"
                    disabled={item.disabled}
                    data-tone={item.tone ?? "default"}
                    data-active={idx === activeIdx ? "true" : "false"}
                    data-testid={`${testId}-item-${item.id}`}
                    className="tr-action-overflow__item-button"
                    onClick={() => {
                      if (!item.disabled) {
                        void runAction(item);
                      }
                    }}
                  >
                    {item.icon && <span aria-hidden="true">{item.icon}</span>}
                    <span>{item.label}</span>
                  </button>
                </li>
              </React.Fragment>
            ))
          )}
        </ul>
      )}
    </div>
  );
}

export default TableRowActionOverflowMenu;
