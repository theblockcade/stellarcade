/**
 * PropertyList — Shared component for displaying metadata-heavy detail views.
 *
 * Renders key-value pairs in a structured, accessible format with support for
 * various value types (text, links, badges, custom content).
 */

import React, { useMemo } from "react";
import "./PropertyList.css";

export type PropertyValueType = "text" | "link" | "badge" | "code" | "custom";

export interface PropertyItem {
  /** Property key/label */
  key: string;
  /** Property value (string or React node for custom) */
  value: string | React.ReactNode;
  /** Value type for styling (default: 'text') */
  type?: PropertyValueType;
  /** For links: href target */
  href?: string;
  /** For links: open in new tab */
  openInNewTab?: boolean;
  /** For badges: tone variant */
  tone?: "neutral" | "info" | "success" | "warning" | "error";
  /** Optional tooltip text */
  tooltip?: string;
  /** Whether to show as loading skeleton */
  isLoading?: boolean;
}

export interface PropertyListProps {
  /** Array of properties to display */
  properties: PropertyItem[];
  /** Section title */
  title?: string;
  /** Number of columns (default: 1, supports 1-3) */
  columns?: 1 | 2 | 3;
  /** Whether to show empty state (default: true) */
  showEmpty?: boolean;
  /** Empty state message */
  emptyMessage?: string;
  /** Optional CSS class */
  className?: string;
  /** Optional test ID */
  testId?: string;
  /** Whether entire list is loading */
  isLoading?: boolean;
}

export const PropertyList: React.FC<PropertyListProps> = ({
  properties,
  title,
  columns = 1,
  showEmpty = true,
  emptyMessage = "No properties to display",
  className = "",
  testId = "property-list",
  isLoading = false,
}) => {
  const baseClass = "property-list";

  const displayProperties = useMemo(() => {
    return properties.filter((p) => p.value !== undefined && p.value !== null);
  }, [properties]);

  const renderValue = (item: PropertyItem): React.ReactNode => {
    if (item.isLoading) {
      return <div className={`${baseClass}__skeleton`} />;
    }

    switch (item.type) {
      case "link":
        return (
          <a
            href={item.href || "#"}
            className={`${baseClass}__link`}
            target={item.openInNewTab ? "_blank" : undefined}
            rel={item.openInNewTab ? "noopener noreferrer" : undefined}
            title={item.tooltip}
          >
            {item.value}
          </a>
        );

      case "badge":
        return (
          <span
            className={`${baseClass}__badge ${baseClass}__badge--${item.tone || "neutral"}`}
            title={item.tooltip}
          >
            {item.value}
          </span>
        );

      case "code":
        return (
          <code className={`${baseClass}__code`} title={item.tooltip}>
            {item.value}
          </code>
        );

      case "custom":
        return item.value;

      case "text":
      default:
        return <span title={item.tooltip}>{item.value}</span>;
    }
  };

  if (isLoading) {
    return (
      <div
        className={`${baseClass} ${className}`.trim()}
        data-testid={testId}
        style={{ "--columns": columns } as React.CSSProperties}
      >
        {title && <h3 className={`${baseClass}__title`}>{title}</h3>}
        <div className={`${baseClass}__grid`}>
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className={`${baseClass}__item`}>
              <div className={`${baseClass}__skeleton-key`} />
              <div className={`${baseClass}__skeleton-value`} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (displayProperties.length === 0 && showEmpty) {
    return (
      <div className={`${baseClass} ${className}`.trim()} data-testid={testId}>
        {title && <h3 className={`${baseClass}__title`}>{title}</h3>}
        <div className={`${baseClass}__empty`}>
          <p className={`${baseClass}__empty-message`}>{emptyMessage}</p>
        </div>
      </div>
    );
  }

  if (displayProperties.length === 0) {
    return null;
  }

  return (
    <div
      className={`${baseClass} ${className}`.trim()}
      data-testid={testId}
      style={{ "--columns": columns } as React.CSSProperties}
    >
      {title && <h3 className={`${baseClass}__title`}>{title}</h3>}
      <div className={`${baseClass}__grid`}>
        {displayProperties.map((item, idx) => (
          <div
            key={`${item.key}-${idx}`}
            className={`${baseClass}__item`}
            data-testid={`${testId}-item-${item.key}`}
          >
            <dt className={`${baseClass}__key`}>{item.key}</dt>
            <dd
              className={`${baseClass}__value ${baseClass}__value--${item.type || "text"}`}
            >
              {renderValue(item)}
            </dd>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PropertyList;
