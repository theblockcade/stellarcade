/**
 * Timeline — reusable ordered-history component.
 *
 * Renders a list of timestamped, status-annotated items in either a horizontal
 * (step-by-step progress) or vertical (chronological history) layout.
 *
 * Used by TxStatusPanel for transaction step tracking and by ContractEventFeed
 * for event history. The generic API avoids over-specialising to either case.
 */

import React from 'react';

export type TimelineItemStatus =
  | 'idle'
  | 'pending'
  | 'active'
  | 'completed'
  | 'error';

export interface TimelineItemData {
  /** Stable key for React reconciliation. */
  id: string;
  /** Primary label shown on the item. */
  label: string;
  /** Lifecycle state that drives visual treatment. */
  status: TimelineItemStatus;
  /** ISO string or locale-formatted string shown in the timestamp slot. */
  timestamp?: string | null;
  /** Secondary detail shown in the metadata slot (truncated if long). */
  metadata?: string | null;
}

export interface TimelineProps {
  items: TimelineItemData[];
  /** Visual orientation of the timeline. Defaults to `'vertical'`. */
  orientation?: 'horizontal' | 'vertical';
  /** Reduces padding and font size for space-constrained contexts. */
  compact?: boolean;
  /** Additional CSS class names applied to the root element. */
  className?: string;
  /** `data-testid` prefix forwarded to child elements. */
  testId?: string;
}

interface TimelineEntryProps {
  item: TimelineItemData;
  orientation: 'horizontal' | 'vertical';
  compact: boolean;
  testId?: string;
}

const TimelineEntry: React.FC<TimelineEntryProps> = ({
  item,
  orientation,
  compact,
  testId,
}) => {
  const entryId = testId ? `${testId}-item-${item.id}` : `sc-timeline-item-${item.id}`;

  return (
    <li
      className={[
        'sc-timeline__item',
        `sc-timeline__item--${item.status}`,
        `sc-timeline__item--${orientation}`,
        compact ? 'sc-timeline__item--compact' : '',
      ]
        .filter(Boolean)
        .join(' ')}
      data-testid={entryId}
      data-status={item.status}
    >
      <span
        className="sc-timeline__dot"
        aria-hidden="true"
        data-testid={`${entryId}-dot`}
      />
      <span className="sc-timeline__label" data-testid={`${entryId}-label`}>
        {item.label}
      </span>
      {item.timestamp && (
        <span
          className="sc-timeline__timestamp"
          data-testid={`${entryId}-timestamp`}
        >
          {item.timestamp}
        </span>
      )}
      {item.metadata && (
        <span
          className="sc-timeline__metadata"
          title={item.metadata}
          data-testid={`${entryId}-metadata`}
        >
          {item.metadata}
        </span>
      )}
    </li>
  );
};

TimelineEntry.displayName = 'TimelineEntry';

/**
 * Timeline
 *
 * Renders an ordered list of `TimelineItemData` entries. The `orientation`
 * prop switches between a horizontal progress-step layout and a vertical
 * chronological-history layout without changing the underlying semantics.
 *
 * Both layouts use `<ol>` with `role="list"` to preserve accessibility for
 * ordered historical content (WCAG 1.3.1).
 */
export const Timeline: React.FC<TimelineProps> = ({
  items,
  orientation = 'vertical',
  compact = false,
  className = '',
  testId = 'sc-timeline',
}) => {
  const rootClasses = [
    'sc-timeline',
    `sc-timeline--${orientation}`,
    compact ? 'sc-timeline--compact' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <ol
      className={rootClasses}
      data-testid={testId}
      aria-label={
        orientation === 'horizontal' ? 'Transaction steps' : 'Event history'
      }
      role="list"
    >
      {items.map((item) => (
        <TimelineEntry
          key={item.id}
          item={item}
          orientation={orientation}
          compact={compact}
          testId={testId}
        />
      ))}
    </ol>
  );
};

Timeline.displayName = 'Timeline';

export default Timeline;
