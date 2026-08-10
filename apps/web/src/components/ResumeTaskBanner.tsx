import React from 'react';
import './ResumeTaskBanner.css';

export interface ResumeTaskBannerProps {
  taskName: string;
  onResume: () => void;
  onDismiss: () => void;
  className?: string;
  testId?: string;
}

export const ResumeTaskBanner: React.FC<ResumeTaskBannerProps> = ({
  taskName,
  onResume,
  onDismiss,
  className = '',
  testId = 'resume-task-banner',
}) => {
  const baseClass = 'resume-task-banner';
  
  return (
    <div
      className={`${baseClass} ${className}`.trim()}
      data-testid={testId}
      role="region"
      aria-label="Resume Task"
    >
      <div className={`${baseClass}__content`}>
        <span className={`${baseClass}__text`}>
          You have an unfinished task: <strong>{taskName}</strong>. Would you like to resume?
        </span>
      </div>
      <div className={`${baseClass}__actions`}>
        <button
          type="button"
          onClick={onResume}
          className={`${baseClass}__btn ${baseClass}__btn--primary`}
          data-testid={`${testId}-resume-btn`}
        >
          Resume
        </button>
        <button
          type="button"
          onClick={onDismiss}
          className={`${baseClass}__btn ${baseClass}__btn--dismiss`}
          data-testid={`${testId}-dismiss-btn`}
          aria-label="Dismiss banner"
        >
          Dismiss
        </button>
      </div>
    </div>
  );
};

export default ResumeTaskBanner;
