"use client";

import React, { useCallback } from "react";
import "./BulkSelectionToolbar.css";

export interface BulkSelectionToolbarProps {
  selectedCount: number;
  totalCount?: number;
  onClear: () => void;
  actions?: Array<{
    id: string;
    label: string;
    onClick: () => void;
    disabled?: boolean;
    variant?: "primary" | "secondary" | "danger";
  }>;
  className?: string;
  testId?: string;
  isVisible?: boolean;
}

export const BulkSelectionToolbar: React.FC<BulkSelectionToolbarProps> = ({
  selectedCount,
  totalCount,
  onClear,
  actions = [],
  className = "",
  testId = "bulk-selection-toolbar",
  isVisible = true,
}) => {
  const handleClear = useCallback(() => {
    onClear();
  }, [onClear]);

  if (!isVisible || selectedCount === 0) {
    return null;
  }

  const containerClass = ["bulk-selection-toolbar", className]
    .filter(Boolean)
    .join(" ");

  const selectionText = totalCount
    ? `${selectedCount} of ${totalCount} selected`
    : `${selectedCount} selected`;

  return (
    <div
      className={containerClass}
      data-testid={testId}
      role="toolbar"
      aria-label="Bulk selection actions"
    >
      <div className="bulk-selection-toolbar__info">
        <span
          className="bulk-selection-toolbar__count"
          data-testid={`${testId}-count`}
        >
          {selectionText}
        </span>
      </div>

      <div className="bulk-selection-toolbar__actions">
        {actions.map((action) => (
          <button
            key={action.id}
            type="button"
            className={`bulk-selection-toolbar__action bulk-selection-toolbar__action--${action.variant || "secondary"}`}
            onClick={action.onClick}
            disabled={action.disabled}
            data-testid={`${testId}-action-${action.id}`}
            aria-label={action.label}
          >
            {action.label}
          </button>
        ))}

        <button
          type="button"
          className="bulk-selection-toolbar__clear"
          onClick={handleClear}
          data-testid={`${testId}-clear`}
          aria-label="Clear selection"
          title="Clear selection"
        >
          ✕
        </button>
      </div>
    </div>
  );
};

export default BulkSelectionToolbar;
