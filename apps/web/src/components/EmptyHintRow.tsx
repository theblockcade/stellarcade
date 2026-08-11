"use client";

import React from "react";
import "./EmptyHintRow.css";

export interface EmptyHintRowProps {
  colSpan?: number;
  message?: string;
  icon?: React.ReactNode;
  className?: string;
  testId?: string;
}

export const EmptyHintRow: React.FC<EmptyHintRowProps> = ({
  colSpan = 1,
  message = "No data available.",
  icon,
  className = "",
  testId = "empty-hint-row",
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

EmptyHintRow.displayName = "EmptyHintRow";
export default EmptyHintRow;
