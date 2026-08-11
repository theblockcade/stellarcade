"use client";

import React, { useCallback, useEffect, useId, useRef, useState } from "react";
import "./TableRowActionOverflowMenu.css";

export type OverflowItemTone = "default" | "danger";

export interface TableRowActionOverflowItem {
  id: string;
  label: string;
  onSelect: () => void | Promise<void>;
  tone?: OverflowItemTone;
  disabled?: boolean;
  icon?: React.ReactNode;
  divider?: boolean;
}

export interface TableRowActionOverflowMenuProps {
  items: TableRowActionOverflowItem[];
  triggerLabel?: string;
  disabled?: boolean;
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
      >
        <span aria-hidden="true">⋮</span>
      </button>

      {open && (
        <ul
          id={menuId}
          role="menu"
          tabIndex={-1}
          aria-label={triggerLabel}
          className="tr-action-overflow__menu"
          data-testid={`${testId}-menu`}
        >
          {items.map((item, idx) => (
            <React.Fragment key={item.id}>
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
          ))}
        </ul>
      )}
    </div>
  );
}

export default TableRowActionOverflowMenu;
