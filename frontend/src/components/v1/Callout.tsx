import React from 'react';
import './Callout.css';

export type CalloutVariant = 'info' | 'warning' | 'success' | 'error';

export interface CalloutProps {
  title?: string;
  children: React.ReactNode;
  variant?: CalloutVariant;
  className?: string;
  testId?: string;
  icon?: React.ReactNode;
}

export const Callout: React.FC<CalloutProps> = ({
  title,
  children,
  variant = 'info',
  className = '',
  testId = 'callout',
  icon,
}) => {
  const baseClass = 'callout';
  const roleAttr = variant === 'error' || variant === 'warning' ? 'alert' : 'status';
  
  return (
    <div
      className={`${baseClass} ${baseClass}--${variant} ${className}`.trim()}
      data-testid={testId}
      role={roleAttr}
    >
      {icon && <div className={`${baseClass}__icon`}>{icon}</div>}
      <div className={`${baseClass}__content`}>
        {title && <h4 className={`${baseClass}__title`}>{title}</h4>}
        <div className={`${baseClass}__body`}>{children}</div>
      </div>
    </div>
  );
};
