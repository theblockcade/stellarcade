import React from 'react';
import './TextDivider.css';

export type TextDividerAlignment = 'left' | 'center' | 'right';
export type TextDividerVariant = 'solid' | 'dashed' | 'dotted';
export type TextDividerThickness = 'thin' | 'medium' | 'thick';

export interface TextDividerProps {
  label?: React.ReactNode;
  badge?: React.ReactNode;
  alignment?: TextDividerAlignment;
  variant?: TextDividerVariant;
  thickness?: TextDividerThickness;
  className?: string;
  testId?: string;
}

export const TextDivider: React.FC<TextDividerProps> = ({
  label,
  badge,
  alignment = 'center',
  variant = 'solid',
  thickness = 'thin',
  className = '',
  testId = 'text-divider',
}) => {
  const hasContent = Boolean(label || badge);

  const classes = [
    'text-divider',
    `text-divider--align-${alignment}`,
    `text-divider--variant-${variant}`,
    `text-divider--thickness-${thickness}`,
    hasContent ? 'text-divider--with-content' : 'text-divider--no-content',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div
      className={classes}
      data-testid={testId}
      role="separator"
      aria-orientation="horizontal"
    >
      <div className="text-divider__line text-divider__line--left" />
      
      {hasContent && (
        <span className="text-divider__content">
          {label && <span className="text-divider__label">{label}</span>}
          {badge && <span className="text-divider__badge">{badge}</span>}
        </span>
      )}

      <div className="text-divider__line text-divider__line--right" />
    </div>
  );
};

TextDivider.displayName = 'TextDivider';
export default TextDivider;
