"use client";

import React from "react";
import { HeadingLevelContext, type HeadingLevel } from "../hooks/useHeadingLevel";
import "./PageIntro.css";

export interface PageIntroBreadcrumb {
  label: string;
  href?: string;
  onClick?: () => void;
}

export interface PageIntroMeta {
  label: string;
  value: React.ReactNode;
}

export interface PageIntroProps {
  title: string;
  eyebrow?: string;
  description?: React.ReactNode;
  breadcrumbs?: PageIntroBreadcrumb[];
  actions?: React.ReactNode;
  meta?: PageIntroMeta[];
  headingLevel?: HeadingLevel;
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
  headingLevel,
  testId = "page-intro",
  className = "",
}: PageIntroProps): React.JSX.Element {
  const contextLevel = React.useContext(HeadingLevelContext);
  const resolvedLevel = Math.max(
    1,
    Math.min(6, headingLevel ?? contextLevel)
  ) as HeadingLevel;
  const HeadingTag = `h${resolvedLevel}` as keyof React.JSX.IntrinsicElements;

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
          <HeadingTag
            id={`${testId}-title`}
            className="page-intro__title"
            data-testid={`${testId}-title`}
            data-heading-level={resolvedLevel}
          >
            {title}
          </HeadingTag>
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
