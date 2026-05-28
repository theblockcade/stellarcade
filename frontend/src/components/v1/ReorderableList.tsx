/**
 * ReorderableList Component - v1
 *
 * A reorderable list with keyboard-accessible drag handles.
 *
 * - Drag handles receive focus and expose a visible focus ring.
 * - Keyboard navigation: ArrowUp / ArrowDown move the focused item;
 *   Space/Enter "grab" and then arrow keys reorder; Escape cancels grab.
 * - Screen-reader announcements via aria-live region.
 * - Supports loading skeleton and empty state.
 */

import React, { useCallback, useRef, useState } from 'react';
import './ReorderableList.css';

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
  /** Label for drag-handle aria-label. Receives item index (1-based). */
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
  skeletonCount = 3,
  emptyMessage = 'No items to display.',
  className = '',
  testId = 'reorderable-list',
  handleAriaLabel = DEFAULT_HANDLE_ARIA_LABEL,
}: ReorderableListProps<T>): JSX.Element {
  const [grabbedIndex, setGrabbedIndex] = useState<number | null>(null);
  const [announcement, setAnnouncement] = useState('');
  const handleRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const dragSourceRef = useRef<number | null>(null);

  const announce = useCallback((msg: string) => {
    setAnnouncement('');
    // Flush then set so repeated moves re-announce
    requestAnimationFrame(() => setAnnouncement(msg));
  }, []);

  // ── Keyboard reorder ──────────────────────────────────────────────────────

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLButtonElement>, index: number) => {
      if (disabled) return;

      switch (e.key) {
        case ' ':
        case 'Enter': {
          e.preventDefault();
          if (grabbedIndex === index) {
            setGrabbedIndex(null);
            announce(`Item dropped at position ${index + 1}.`);
          } else {
            setGrabbedIndex(index);
            announce(
              `Item ${index + 1} grabbed. Use arrow keys to move, Space or Enter to drop, Escape to cancel.`,
            );
          }
          break;
        }
        case 'Escape': {
          if (grabbedIndex !== null) {
            e.preventDefault();
            setGrabbedIndex(null);
            announce('Reorder cancelled.');
          }
          break;
        }
        case 'ArrowUp': {
          e.preventDefault();
          if (grabbedIndex !== null && grabbedIndex > 0) {
            const reordered = move(items, grabbedIndex, grabbedIndex - 1);
            onReorder(reordered);
            const next = grabbedIndex - 1;
            setGrabbedIndex(next);
            announce(`Moved to position ${next + 1}.`);
            requestAnimationFrame(() => handleRefs.current[next]?.focus());
          } else if (grabbedIndex === null && index > 0) {
            handleRefs.current[index - 1]?.focus();
          }
          break;
        }
        case 'ArrowDown': {
          e.preventDefault();
          if (grabbedIndex !== null && grabbedIndex < items.length - 1) {
            const reordered = move(items, grabbedIndex, grabbedIndex + 1);
            onReorder(reordered);
            const next = grabbedIndex + 1;
            setGrabbedIndex(next);
            announce(`Moved to position ${next + 1}.`);
            requestAnimationFrame(() => handleRefs.current[next]?.focus());
          } else if (grabbedIndex === null && index < items.length - 1) {
            handleRefs.current[index + 1]?.focus();
          }
          break;
        }
        default:
          break;
      }
    },
    [disabled, grabbedIndex, items, onReorder, announce],
  );

  // ── Pointer drag ──────────────────────────────────────────────────────────

  const handleDragStart = useCallback(
    (e: React.DragEvent<HTMLLIElement>, index: number) => {
      if (disabled) return;
      dragSourceRef.current = index;
      e.dataTransfer.effectAllowed = 'move';
    },
    [disabled],
  );

  const handleDragOver = useCallback(
    (e: React.DragEvent<HTMLLIElement>) => {
      if (disabled) return;
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
    },
    [disabled],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLLIElement>, targetIndex: number) => {
      if (disabled) return;
      e.preventDefault();
      const from = dragSourceRef.current;
      if (from === null || from === targetIndex) return;
      onReorder(move(items, from, targetIndex));
      dragSourceRef.current = null;
    },
    [disabled, items, onReorder],
  );

  const handleDragEnd = useCallback(() => {
    dragSourceRef.current = null;
  }, []);

  // ── Render ────────────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <div
        className={`rl rl--loading ${className}`}
        data-testid={testId}
        aria-busy="true"
        aria-label="Loading list"
      >
        {Array.from({ length: skeletonCount }, (_, i) => (
          <div key={i} className="rl__skeleton" aria-hidden="true" />
        ))}
      </div>
    );
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
              className={`rl__item${isGrabbed ? ' rl__item--grabbed' : ''}`}
              draggable={!disabled}
              onDragStart={(e) => handleDragStart(e, index)}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, index)}
              onDragEnd={handleDragEnd}
              data-testid={`${testId}-item-${index}`}
            >
              <button
                ref={(el) => {
                  handleRefs.current[index] = el;
                }}
                type="button"
                className={`rl__handle${isGrabbed ? ' rl__handle--grabbed' : ''}`}
                aria-label={handleAriaLabel(index + 1, items.length)}
                aria-pressed={isGrabbed}
                aria-describedby={`${testId}-instructions`}
                disabled={disabled}
                onKeyDown={(e) => handleKeyDown(e, index)}
                tabIndex={0}
                data-testid={`${testId}-handle-${index}`}
              >
                {/* Drag handle icon — three horizontal lines */}
                <svg
                  className="rl__handle-icon"
                  aria-hidden="true"
                  focusable="false"
                  viewBox="0 0 16 16"
                  width="16"
                  height="16"
                >
                  <rect y="2" width="16" height="2" rx="1" />
                  <rect y="7" width="16" height="2" rx="1" />
                  <rect y="12" width="16" height="2" rx="1" />
                </svg>
              </button>

              <div className="rl__content">{renderItem(item, index)}</div>
            </li>
          );
        })}
      </ul>

      {/* Screen-reader instructions (visually hidden) */}
      <p id={`${testId}-instructions`} className="rl__sr-instructions">
        Use arrow keys to navigate handles. Press Space or Enter to grab an item, then use arrow
        keys to reorder it, then Space, Enter, or Escape to release.
      </p>

      {/* Live announcements for screen readers */}
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
