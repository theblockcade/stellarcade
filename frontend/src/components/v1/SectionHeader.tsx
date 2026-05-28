import React from "react";
import { HeadingLevelContext, type HeadingLevel } from "../../hooks/v1/useHeadingLevel";

export interface SectionHeaderProps {
  /** Provide an id so sections can reference it via aria-labelledby. */
  titleId: string;
  /** Main header text. */
  title: string;
  /** Optional supporting copy under the title. */
  description?: string;
  /** Optional right-side actions (buttons/toggles/links). */
  actions?: React.ReactNode;
  /** Optional semantic heading override for nested layouts. */
  headingLevel?: HeadingLevel;
}

/**
 * SectionHeader — reusable dashboard section header with optional actions.
 * Intentionally reuses existing dashboard header styling via `dashboard-section-heading`.
 */
export function SectionHeader({
  titleId,
  title,
  description,
  actions,
  headingLevel,
}: SectionHeaderProps): React.JSX.Element {
  const contextLevel = React.useContext(HeadingLevelContext);
  const resolvedLevel = Math.max(
    1,
    Math.min(6, headingLevel ?? contextLevel),
  ) as HeadingLevel;
  const HeadingTag = `h${resolvedLevel}` as keyof React.JSX.IntrinsicElements;

  if (
    process.env.NODE_ENV !== "production" &&
    headingLevel === undefined &&
    contextLevel > 6
  ) {
    console.warn(
      `[SectionHeader] Heading level would exceed h6 (context depth: ${contextLevel}). ` +
        "Consider flattening the section layout or setting headingLevel explicitly.",
    );
  }

  return (
    <div className="dashboard-section-heading" data-testid="section-header">
      <div>
        <HeadingTag id={titleId} data-heading-level={resolvedLevel}>
          {title}
        </HeadingTag>
        {description ? <p>{description}</p> : null}
      </div>
      {actions ? <div>{actions}</div> : null}
    </div>
  );
}

export default SectionHeader;

