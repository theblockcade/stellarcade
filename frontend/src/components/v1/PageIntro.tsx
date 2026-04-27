import React from "react";
import "./PageIntro.css";

/**
 * Page intro pattern for feature-heavy dashboard routes (#576).
 *
 * Standardises the top-of-page header so dense routes like Audit Log,
 * Analytics, Treasury, and Player Lookup don't each invent their own. Slots
 * cover the common shape: optional eyebrow, title, description, breadcrumbs,
 * primary actions, and a meta strip for status / counts / freshness.
 *
 * The component is presentational — callers decide what state drives each
 * slot. Empty / loading states are surfaced through the `meta` array
 * (caller passes a "Loading…" item) and the `actions` slot (caller can
 * disable the buttons), so this component doesn't need its own data layer.
 */
export interface PageIntroBreadcrumb {
  /** Display label. */
  label: string;
  /** Optional href; when omitted the crumb renders as plain text (current page). */
  href?: string;
  /** Optional click handler — preferred over `href` for SPA navigation. */
  onClick?: () => void;
}

export interface PageIntroMeta {
  label: string;
  value: React.ReactNode;
}

export interface PageIntroProps {
  /** Required title — main heading for the page. */
  title: string;
  /** Optional eyebrow rendered above the title. */
  eyebrow?: string;
  /** Optional supporting description, typically one to two sentences. */
  description?: React.ReactNode;
  /** Optional breadcrumb trail. The last crumb is treated as the current page. */
  breadcrumbs?: PageIntroBreadcrumb[];
  /** Optional inline action slot rendered top-right. */
  actions?: React.ReactNode;
  /** Optional meta strip rendered at the bottom of the intro card. */
  meta?: PageIntroMeta[];
  /** Optional override for `data-testid` on the root section. */
  testId?: string;
  className?: string;
}

export function PageIntro({
  title,
  eyebrow,
  description,
  breadcrumbs,
  actions,
  meta,
  testId = "page-intro",
  className = "",
}: PageIntroProps): React.JSX.Element {
  return (
    <section
      className={`page-intro ${className}`.trim()}
      aria-labelledby={`${testId}-title`}
      data-testid={testId}
    >
      {breadcrumbs && breadcrumbs.length > 0 && (
        <ol
          className="page-intro__breadcrumbs"
          aria-label="Breadcrumb"
          data-testid={`${testId}-breadcrumbs`}
        >
          {breadcrumbs.map((crumb, idx) => {
            const isLast = idx === breadcrumbs.length - 1;
            return (
              <li key={`${crumb.label}-${idx}`}>
                {crumb.href || crumb.onClick ? (
                  <a
                    href={crumb.href ?? "#"}
                    onClick={(e) => {
                      if (crumb.onClick) {
                        e.preventDefault();
                        crumb.onClick();
                      }
                    }}
                    className="page-intro__breadcrumb-link"
                    aria-current={isLast ? "page" : undefined}
                    data-testid={`${testId}-breadcrumb-${idx}`}
                  >
                    {crumb.label}
                  </a>
                ) : (
                  <span
                    aria-current={isLast ? "page" : undefined}
                    data-testid={`${testId}-breadcrumb-${idx}`}
                  >
                    {crumb.label}
                  </span>
                )}
              </li>
            );
          })}
        </ol>
      )}

      <div className="page-intro__top">
        <div className="page-intro__copy">
          {eyebrow && (
            <p
              className="page-intro__eyebrow"
              data-testid={`${testId}-eyebrow`}
            >
              {eyebrow}
            </p>
          )}
          <h1
            id={`${testId}-title`}
            className="page-intro__title"
            data-testid={`${testId}-title`}
          >
            {title}
          </h1>
          {description && (
            <p
              className="page-intro__description"
              data-testid={`${testId}-description`}
            >
              {description}
            </p>
          )}
        </div>

        {actions && (
          <div
            className="page-intro__actions"
            data-testid={`${testId}-actions`}
          >
            {actions}
          </div>
        )}
      </div>

      {meta && meta.length > 0 && (
        <dl className="page-intro__meta" data-testid={`${testId}-meta`}>
          {meta.map((item, idx) => (
            <div
              key={`${item.label}-${idx}`}
              className="page-intro__meta-item"
              data-testid={`${testId}-meta-${idx}`}
            >
              <dt className="page-intro__meta-label">{item.label}</dt>
              <dd className="page-intro__meta-value">{item.value}</dd>
            </div>
          ))}
        </dl>
      )}
    </section>
  );
}

export default PageIntro;
