import React, { useMemo } from 'react';
import { HeadingLevelContext, type HeadingLevel } from '../../hooks/v1/useHeadingLevel';
import './ContentShell.css';

export interface ContentShellProps {
  /** Section title rendered as the correct h* element for the current nesting depth. */
  title: React.ReactNode;
  /** Stable id for the heading element — recommended for aria-labelledby references. */
  titleId?: string;
  /** Supporting copy rendered below the title. */
  description?: React.ReactNode;
  /** Actions (buttons, controls) rendered in the header row. */
  actions?: React.ReactNode;
  children?: React.ReactNode;
  /**
   * Override the heading level instead of inheriting from context.
   * Only use this when the shell is genuinely at a fixed semantic depth.
   */
  headingLevel?: HeadingLevel;
  className?: string;
  testId?: string;
}

function clampLevel(level: number): HeadingLevel {
  return Math.max(1, Math.min(6, level)) as HeadingLevel;
}

export const ContentShell: React.FC<ContentShellProps> = ({
  title,
  titleId,
  description,
  actions,
  children,
  headingLevel,
  className = '',
  testId = 'content-shell',
}) => {
  const contextLevel = React.useContext(HeadingLevelContext);
  const resolvedLevel: HeadingLevel = headingLevel ?? contextLevel;
  const childLevel: HeadingLevel = clampLevel(resolvedLevel + 1);

  if (process.env.NODE_ENV !== 'production' && headingLevel === undefined && contextLevel > 6) {
    console.warn(
      `[ContentShell] Heading level would exceed h6 (context depth: ${contextLevel}). ` +
        'Consider flattening the nesting or using headingLevel override.',
    );
  }

  const HeadingTag = useMemo(
    () => `h${resolvedLevel}` as keyof React.JSX.IntrinsicElements,
    [resolvedLevel],
  );

  const containerClass = ['content-shell', className].filter(Boolean).join(' ');

  return (
    <HeadingLevelContext.Provider value={childLevel}>
      <div className={containerClass} data-testid={testId}>
        <div className="content-shell__header" data-testid={`${testId}-header`}>
          <div className="content-shell__title-group">
            <HeadingTag
              id={titleId}
              className={`content-shell__title content-shell__title--h${resolvedLevel}`}
              data-testid={`${testId}-title`}
              data-heading-level={resolvedLevel}
            >
              {title}
            </HeadingTag>
            {description && (
              <p className="content-shell__description" data-testid={`${testId}-description`}>
                {description}
              </p>
            )}
          </div>
          {actions && (
            <div className="content-shell__actions" data-testid={`${testId}-actions`}>
              {actions}
            </div>
          )}
        </div>

        {children !== undefined && children !== null && (
          <div className="content-shell__body" data-testid={`${testId}-body`}>
            {children}
          </div>
        )}
      </div>
    </HeadingLevelContext.Provider>
  );
};

ContentShell.displayName = 'ContentShell';

export default ContentShell;
