"use client";

import React from "react";
import "./QuickPivotLinks.css";

export interface PivotLink {
  id: string;
  label: string;
  href?: string;
  onClick?: () => void;
  icon?: React.ReactNode;
  badge?: string | number;
  disabled?: boolean;
  external?: boolean;
}

export interface QuickPivotLinksProps {
  links: PivotLink[];
  activeId?: string;
  orientation?: "horizontal" | "vertical";
  size?: "compact" | "default";
  className?: string;
  testId?: string;
  loading?: boolean;
  emptyMessage?: string;
}

export const QuickPivotLinks: React.FC<QuickPivotLinksProps> = ({
  links,
  activeId,
  orientation = "horizontal",
  size = "default",
  className = "",
  testId = "quick-pivot-links",
  loading = false,
  emptyMessage = "No related records available",
}) => {
  const containerClasses = [
    "quick-pivot-links",
    `quick-pivot-links--${orientation}`,
    `quick-pivot-links--${size}`,
    className,
  ]
    .filter(Boolean)
    .join(" ");

  if (loading) {
    return (
      <nav className={containerClasses} data-testid={`${testId}-loading`} aria-label="Related records">
        <div className="quick-pivot-links__loading" role="status" aria-live="polite">
          <div className="quick-pivot-links__skeleton" />
        </div>
      </nav>
    );
  }

  if (links.length === 0) {
    return (
      <div className="quick-pivot-links__empty" data-testid={`${testId}-empty`} role="status">
        <span className="quick-pivot-links__empty-message">{emptyMessage}</span>
      </div>
    );
  }

  const handleLinkClick = (link: PivotLink, event: React.MouseEvent) => {
    if (link.disabled) {
      event.preventDefault();
      return;
    }

    if (link.onClick) {
      event.preventDefault();
      link.onClick();
    }
  };

  return (
    <nav className={containerClasses} data-testid={testId} aria-label="Related records">
      <ul className="quick-pivot-links__list" role="list">
        {links.map((link) => {
          const isActive = activeId === link.id;
          const linkClasses = [
            "quick-pivot-links__link",
            isActive ? "quick-pivot-links__link--active" : "",
            link.disabled ? "quick-pivot-links__link--disabled" : "",
          ]
            .filter(Boolean)
            .join(" ");

          const linkContent = (
            <>
              {link.icon && (
                <span className="quick-pivot-links__icon" aria-hidden="true">
                  {link.icon}
                </span>
              )}
              <span className="quick-pivot-links__label">{link.label}</span>
              {link.badge && (
                <span className="quick-pivot-links__badge">
                  {link.badge}
                </span>
              )}
              {link.external && (
                <span className="quick-pivot-links__external-icon" aria-hidden="true">
                  ↗
                </span>
              )}
            </>
          );

          return (
            <li key={link.id} className="quick-pivot-links__item">
              {link.href ? (
                <a
                  href={link.href}
                  className={linkClasses}
                  onClick={(e) => handleLinkClick(link, e)}
                  aria-current={isActive ? "page" : undefined}
                  target={link.external ? "_blank" : undefined}
                  rel={link.external ? "noopener noreferrer" : undefined}
                  data-testid={`${testId}-link-${link.id}`}
                >
                  {linkContent}
                </a>
              ) : (
                <button
                  type="button"
                  className={linkClasses}
                  onClick={(e) => handleLinkClick(link, e)}
                  aria-current={isActive ? "page" : undefined}
                  disabled={link.disabled}
                  data-testid={`${testId}-link-${link.id}`}
                >
                  {linkContent}
                </button>
              )}
            </li>
          );
        })}
      </ul>
    </nav>
  );
};

export default QuickPivotLinks;
