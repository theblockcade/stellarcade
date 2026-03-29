import React, { useEffect, useMemo, useRef, useState } from 'react';
import type { AppError } from '../../types/errors';
import { writeToClipboard } from '../../utils/v1/clipboard';
import { ErrorNotice } from './ErrorNotice';
import { useErrorStore } from '../../store/errorStore';

type CopyButtonStatus = 'idle' | 'copying' | 'copied';

export interface CopyButtonProps
  extends Omit<
    React.ButtonHTMLAttributes<HTMLButtonElement>,
    'children' | 'onClick'
  > {
  text: string;
  idleLabel?: React.ReactNode;
  copyingLabel?: React.ReactNode;
  copiedLabel?: React.ReactNode;
  feedbackDurationMs?: number;
  onCopy?: () => void | Promise<void>;
  onCopyError?: (error: AppError) => void | Promise<void>;
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
  testId?: string;
}

export function CopyButton({
  text,
  idleLabel = 'Copy',
  copyingLabel = 'Copying...',
  copiedLabel = 'Copied',
  feedbackDurationMs = 2000,
  onCopy,
  onCopyError,
  onClick,
  className = '',
  disabled = false,
  type = 'button',
  testId = 'copy-button',
  ...buttonProps
}: CopyButtonProps) {
  const [status, setStatus] = useState<CopyButtonStatus>('idle');
  const [error, setError] = useState<AppError | null>(null);
  const timeoutRef = useRef<number | null>(null);
  const setGlobalError = useErrorStore((state) => state.setError);

  useEffect(() => {
    return () => {
      if (timeoutRef.current !== null) {
        window.clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const isBusy = status === 'copying';
  const isDisabled = disabled || isBusy;

  const buttonLabel = useMemo(() => {
    if (status === 'copying') {
      return copyingLabel;
    }

    if (status === 'copied') {
      return copiedLabel;
    }

    return idleLabel;
  }, [copiedLabel, copyingLabel, idleLabel, status]);

  const statusMessage = status === 'copied' ? 'Copied to clipboard.' : '';

  const scheduleReset = () => {
    if (timeoutRef.current !== null) {
      window.clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = window.setTimeout(() => {
      setStatus('idle');
      timeoutRef.current = null;
    }, feedbackDurationMs);
  };

  const handleCopy = async (
    event: React.MouseEvent<HTMLButtonElement>,
  ): Promise<void> => {
    onClick?.(event);

    if (event.defaultPrevented || isDisabled) {
      return;
    }

    setError(null);
    setStatus('copying');

    const result = await writeToClipboard(text);

    if (result.ok) {
      await onCopy?.();
      setStatus('copied');
      scheduleReset();
      return;
    }

    setStatus('idle');
    setError(result.error);
    setGlobalError(result.error);
    await onCopyError?.(result.error);
  };

  return (
    <div className={className} data-testid={`${testId}-container`}>
      <button
        {...buttonProps}
        type={type}
        disabled={isDisabled}
        onClick={handleCopy}
        aria-busy={isBusy}
        aria-disabled={isDisabled}
        data-testid={testId}
      >
        {buttonLabel}
      </button>

      <span
        role="status"
        aria-live="polite"
        data-testid={`${testId}-status`}
      >
        {statusMessage}
      </span>

      {error ? (
        <ErrorNotice
          error={error}
          onDismiss={() => setError(null)}
          testId={`${testId}-error`}
        />
      ) : null}
    </div>
  );
}
import React, { useState, useEffect, useCallback } from 'react';
import { copyToClipboard } from '../../utils/v1/clipboard';
import { useErrorStore } from '../../store/errorStore';

export interface CopyButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** The text to copy to the clipboard when clicked. */
  text: string;
  /** Custom label when the button is in default state. */
  children?: React.ReactNode;
  /** Custom test ID for testing. */
  testId?: string;
  /** How long to show the success state before reverting back to default (ms). Default 2000ms. */
  feedbackDurationMs?: number;
  /** Optional callback to notify parent when text is successfully copied */
  onCopySuccess?: () => void;
  /** Display format: 'icon' strictly, 'text', or 'both'. Default is 'icon' */
  variant?: 'icon' | 'text' | 'both';
}

/**
 * CopyButton Component - v1
 * 
 * Reusable button to copy text to the clipboard with inline success feedback
 * and global error fallback if copy fails unsupported environment.
 */
export const CopyButton: React.FC<CopyButtonProps> = ({
  text,
  children,
  testId = 'copy-button',
  feedbackDurationMs = 2000,
  onCopySuccess,
  variant = 'icon',
  className = '',
  ...rest
}) => {
  const [copied, setCopied] = useState(false);
  const setError = useErrorStore((state) => state.setError);

  const handleCopy = useCallback(async (e: React.MouseEvent<HTMLButtonElement>) => {
    // Prevent event bubbling if the button is within another interactive element
    e.stopPropagation();

    // Reset state before copy attempt
    setCopied(false);

    try {
      const result = await copyToClipboard(text);
      if (result.success) {
        setCopied(true);
        onCopySuccess?.();
      } else {
        setError({
          code: 'CLIPBOARD_NOT_SUPPORTED',
          domain: 'ui',
          severity: 'user_actionable',
          message: 'Unable to copy text to clipboard.',
          action: 'Please select and copy the text manually.',
        });
      }
    } catch (error) {
       setError({
          code: 'CLIPBOARD_ERROR',
          domain: 'ui',
          severity: 'terminal',
          message: 'An unexpected error occurred while trying to copy text.',
          debug: { originalError: error }
        });
    }
  }, [text, onCopySuccess, setError]);

  // Handle automatic timeout for success feedback
  useEffect(() => {
    if (!copied) return;

    const timeout = setTimeout(() => {
      setCopied(false);
    }, feedbackDurationMs);

    return () => clearTimeout(timeout);
  }, [copied, feedbackDurationMs]);

  const baseClass = `copy-button copy-button--${variant} ${className}`.trim();

  return (
    <button
      type="button"
      className={baseClass}
      onClick={handleCopy}
      data-testid={testId}
      aria-label={copied ? 'Copied to clipboard' : 'Copy to clipboard'}
      aria-live="polite"
      {...rest}
    >
      <span className="copy-button__content">
        {(variant === 'icon' || variant === 'both') && (
          <span 
            className={`icon icon--${copied ? 'check-circle' : 'copy'}`} 
            aria-hidden="true" 
            data-testid={`${testId}-icon`}
          />
        )}
        
        {(variant === 'text' || variant === 'both') && (
          <span className="copy-button__text" data-testid={`${testId}-text`}>
            {copied ? 'Copied!' : (children || 'Copy')}
          </span>
        )}
      </span>
    </button>
  );
};

export default CopyButton;
