import React from 'react';
import './EmptyHintRow.css';

export interface EmptyHintRowProps {
  /** Number of columns the cell should span. */
  colSpan?: number;
  /** Message shown to the user. */
  message?: string;
  /** Optional icon/emoji prefix. */
  icon?: React.ReactNode;
  className?: string;
  testId?: string;
}

/**
 * EmptyHintRow — drop-in <tr> for tables and feed lists that have no data.
 *
 * Usage inside a <tbody>:
 *   {rows.length === 0 && <EmptyHintRow colSpan={5} message="No transactions yet." />}
 */
export const EmptyHintRow: React.FC<EmptyHintRowProps> = ({
  colSpan = 1,
  message = 'No data available.',
  icon,
  className = '',
  testId = 'empty-hint-row',
}) => (
  <tr
    className={`empty-hint-row ${className}`.trim()}
    data-testid={testId}
    role="row"
  >
    <td
      colSpan={colSpan}
      className="empty-hint-row__cell"
      role="cell"
      aria-live="polite"
    >
      {icon && (
        <span className="empty-hint-row__icon" aria-hidden="true">
          {icon}
        </span>
      )}
      <span className="empty-hint-row__message">{message}</span>
    </td>
  </tr>
);

EmptyHintRow.displayName = 'EmptyHintRow';
export default EmptyHintRow;
