import React from "react";
import { EmptyStateBlock } from "./EmptyStateBlock";
import type { EmptyStateAction } from "./EmptyStateBlock.types";
import "./EmptyResultCallout.css";

export interface EmptyResultCalloutProps {
  title?: string;
  query?: string | null;
  activeFilters?: string[];
  onClear?: () => void;
  clearLabel?: string;
  disabled?: boolean;
  testId?: string;
}

function buildDescription(query?: string | null, activeFilters: string[] = []) {
  const parts: string[] = [];
  const trimmedQuery = query?.trim();

  if (trimmedQuery) {
    parts.push(`search "${trimmedQuery}"`);
  }

  if (activeFilters.length > 0) {
    parts.push(`${activeFilters.length} active filter${activeFilters.length === 1 ? "" : "s"}`);
  }

  if (parts.length === 0) {
    return "No items match the current search or filter state.";
  }

  return `No items match ${parts.join(" and ")}.`;
}

export const EmptyResultCallout: React.FC<EmptyResultCalloutProps> = ({
  title = "No matching results",
  query,
  activeFilters = [],
  onClear,
  clearLabel = "Clear filters",
  disabled = false,
  testId = "empty-result-callout",
}) => {
  const actions: EmptyStateAction[] =
    onClear !== undefined
      ? [
          {
            label: clearLabel,
            onClick: onClear,
            variant: "primary",
            disabled,
          },
        ]
      : [];

  return (
    <EmptyStateBlock
      variant="no-results"
      icon="search"
      title={title}
      description={buildDescription(query, activeFilters)}
      actions={actions}
      className="empty-result-callout"
      testId={testId}
    />
  );
};

EmptyResultCallout.displayName = "EmptyResultCallout";

export default EmptyResultCallout;
