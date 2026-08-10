import React, { useState, useRef, useId } from 'react';
import './Tooltip.css';

export interface TooltipProps {
  content: React.ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
  children: React.ReactElement;
  id?: string;
  delayMs?: number;
  className?: string;
  testId?: string;
}

export const Tooltip: React.FC<TooltipProps> = ({
  content,
  position = 'top',
  children,
  id: customId,
  delayMs = 200,
  className = '',
  testId = 'tooltip',
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const generatedId = useId();
  const tooltipId = customId || `tooltip-${generatedId}`;

  const showTooltip = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (delayMs === 0) {
      setIsVisible(true);
    } else {
      timeoutRef.current = setTimeout(() => {
        setIsVisible(true);
      }, delayMs);
    }
  };

  const hideTooltip = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setIsVisible(false);
  };

  // Clone trigger element to attach mouse and focus events
  const triggerElement = React.cloneElement(children, {
    'aria-describedby': tooltipId,
    onMouseEnter: (e: React.MouseEvent) => {
      children.props.onMouseEnter?.(e);
      showTooltip();
    },
    onMouseLeave: (e: React.MouseEvent) => {
      children.props.onMouseLeave?.(e);
      hideTooltip();
    },
    onFocus: (e: React.FocusEvent) => {
      children.props.onFocus?.(e);
      showTooltip();
    },
    onBlur: (e: React.FocusEvent) => {
      children.props.onBlur?.(e);
      hideTooltip();
    },
  });

  return (
    <div className={`tooltip-wrapper ${className}`} data-testid={`${testId}-wrapper`}>
      {triggerElement}
      
      {isVisible && (
        <div
          id={tooltipId}
          className={`tooltip-bubble tooltip-bubble--${position}`}
          role="tooltip"
          data-testid={testId}
        >
          {content}
          <div className="tooltip-arrow" />
        </div>
      )}
    </div>
  );
};

Tooltip.displayName = 'Tooltip';
export default Tooltip;
