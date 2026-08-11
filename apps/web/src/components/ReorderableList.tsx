"use client";

import React, { useCallback, useRef, useState } from "react";
import "./ReorderableList.css";

export interface ReorderableListItem {
  id: string;
  [key: string]: unknown;
}

export interface ReorderableListProps<T extends ReorderableListItem> {
  items: T[];
  onReorder: (reordered: T[]) => void;
  renderItem: (item: T, index: number) => React.ReactNode;
  isLoading?: boolean;
  disabled?: boolean;
  skeletonCount?: number;
  emptyMessage?: string;
  className?: string;
  testId?: string;
  handleAriaLabel?: (index: number, total: number) => string;
}

function move<T>(arr: T[], from: number, to: number): T[] {
  if (from === to) return arr;
  const result = [...arr];
  const [item] = result.splice(from, 1);
  result.splice(to, 0, item);
  return result;
}

const DEFAULT_HANDLE_ARIA_LABEL = (index: number, total: number) =>
  `Drag handle. Item ${index} of ${total}. Press Space to grab and use arrow keys to move.`;

export function ReorderableList<T extends ReorderableListItem>({
  items,
  onReorder,
  renderItem,
  isLoading = false,
  disabled = false,
  emptyMessage = "No items to display.",
  className = "",
  testId = "reorderable-list",
  handleAriaLabel = DEFAULT_HANDLE_ARIA_LABEL,
}: ReorderableListProps<T>): React.JSX.Element {
  const [grabbedIndex, setGrabbedIndex] = useState<number | null>(null);
  const [announcement, setAnnouncement] = useState("");
  const handleRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const announce = useCallback((msg: string) => {
    setAnnouncement("");
    requestAnimationFrame(() => setAnnouncement(msg));
  }, []);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLButtonElement>, index: number) => {
      if (disabled) return;

      switch (e.key) {
        case " ":
        case "Enter": {
          e.preventDefault();
          if (grabbedIndex === index) {
            setGrabbedIndex(null);
            announce(`Item dropped at position ${index + 1}.`);
          } else {
            setGrabbedIndex(index);
            announce(
              `Item ${index + 1} grabbed. Use arrow keys to move.`
            );
          }
          break;
        }
        case "Escape": {
          if (grabbedIndex !== null) {
            e.preventDefault();
            setGrabbedIndex(null);
            announce("Reorder cancelled.");
          }
          break;
        }
        case "ArrowUp": {
          e.preventDefault();
          if (grabbedIndex !== null && grabbedIndex > 0) {
            const reordered = move(items, grabbedIndex, grabbedIndex - 1);
            onReorder(reordered);
            const next = grabbedIndex - 1;
            setGrabbedIndex(next);
            announce(`Moved to position ${next + 1}.`);
            requestAnimationFrame(() => handleRefs.current[next]?.focus());
          }
          break;
        }
        case "ArrowDown": {
          e.preventDefault();
          if (grabbedIndex !== null && grabbedIndex < items.length - 1) {
            const reordered = move(items, grabbedIndex, grabbedIndex + 1);
            onReorder(reordered);
            const next = grabbedIndex + 1;
            setGrabbedIndex(next);
            announce(`Moved to position ${next + 1}.`);
            requestAnimationFrame(() => handleRefs.current[next]?.focus());
          }
          break;
        }
        default:
          break;
      }
    },
    [disabled, grabbedIndex, items, onReorder, announce]
  );

  if (isLoading) {
    return <div data-testid={`${testId}-loading`}>Loading...</div>;
  }

  if (items.length === 0) {
    return (
      <div className={`rl rl--empty ${className}`} data-testid={testId}>
        <p className="rl__empty-message" role="status">
          {emptyMessage}
        </p>
      </div>
    );
  }

  return (
    <div className={`rl ${className}`} data-testid={testId}>
      <ul className="rl__list" role="list" aria-label="Reorderable list">
        {items.map((item, index) => {
          const isGrabbed = grabbedIndex === index;
          return (
            <li
              key={item.id}
              className={`rl__item${isGrabbed ? " rl__item--grabbed" : ""}`}
              data-testid={`${testId}-item-${index}`}
            >
              <button
                ref={(el) => {
                  handleRefs.current[index] = el;
                }}
                type="button"
                className={`rl__handle${isGrabbed ? " rl__handle--grabbed" : ""}`}
                aria-label={handleAriaLabel(index + 1, items.length)}
                aria-pressed={isGrabbed}
                disabled={disabled}
                onKeyDown={(e) => handleKeyDown(e, index)}
                tabIndex={0}
                data-testid={`${testId}-handle-${index}`}
              >
                ≡
              </button>

              <div className="rl__content">{renderItem(item, index)}</div>
            </li>
          );
        })}
      </ul>

      <div
        role="status"
        aria-live="assertive"
        aria-atomic="true"
        className="rl__sr-live"
        data-testid={`${testId}-announcement`}
      >
        {announcement}
      </div>
    </div>
  );
}

export default ReorderableList;
